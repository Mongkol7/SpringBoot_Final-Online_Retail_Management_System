package com.retail.store.service.impl;

import com.retail.store.entity.Order;
import com.retail.store.entity.OrderItem;
import com.retail.store.entity.PosShift;
import com.retail.store.entity.Product;
import com.retail.store.entity.User;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.OrderChannel;
import com.retail.store.entity.enums.OrderStatus;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.entity.enums.PosShiftStatus;
import com.retail.store.entity.enums.TransactionType;
import com.retail.store.exception.BadRequestException;
import com.retail.store.exception.InsufficientCashTenderedException;
import com.retail.store.exception.InsufficientStockException;
import com.retail.store.exception.ResourceNotFoundException;
import com.retail.store.exception.UnauthorizedRoleException;
import com.retail.store.repository.OrderItemRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.PosShiftRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.security.jwt.JwtTokenProvider;
import com.retail.store.service.AuthService;
import com.retail.store.service.BatchAllocationService;
import com.retail.store.service.CashierService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * =========================================================================
 * 👤 ASSIGNED TO: PERSON 2 (CASHIER Role)
 * =========================================================================
 * Responsibilities:
 * 1. Rapid Walk-In In-Store POS Checkout:
 *    - Process items scanned by barcode or selected in POS terminal.
 *    - Enforce STRICT RETAIL PRICING LOCK (walk-in POS never gets wholesale prices).
 *    - Calculate subtotal, 7% VAT, and grand total.
 *    - Validate cash tendered >= total, and calculate changeDue.
 *    - Persist Order with channel = POS, cashier_id = staffUserId.
 *    - Trigger inventory deduction via BatchAllocationService (FIFO/FEFO).
 * 2. 80mm Thermal Receipt Generation:
 *    - Construct formatted receipt DTO containing store header, cashier name,
 *      itemized breakdown, subtotal, tax, grand total, amount tendered, change,
 *      and barcode verification string.
 * 3. Cashier Shift Management & Reconciliation:
 *    - Open shift with opening float.
 *    - Close shift with drawer reconciliation and variance calculation.
 *    - Query current shift stats.
 * 4. Barcode / SKU Scan Helper:
 *    - Instant product verification and available stock lookup.
 * =========================================================================
 */
@Service
public class CashierServiceImpl implements CashierService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PosShiftRepository posShiftRepository;
    private final BatchAllocationService batchAllocationService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public CashierServiceImpl(UserRepository userRepository,
                              ProductRepository productRepository,
                              OrderRepository orderRepository,
                              OrderItemRepository orderItemRepository,
                              PosShiftRepository posShiftRepository,
                              BatchAllocationService batchAllocationService,
                              AuthenticationManager authenticationManager,
                              JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.posShiftRepository = posShiftRepository;
        this.batchAllocationService = batchAllocationService;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthService.AuthResponse login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found with email: " + email));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Your cashier account has been deactivated. Contact store administrator.");
        }

        String roleName = user.getRole().getName();
        if (!"CASHIER".equalsIgnoreCase(roleName) && !"ADMIN".equalsIgnoreCase(roleName)) {
            throw new UnauthorizedRoleException("Access denied: User does not hold CASHIER staff credentials.");
        }

        String token = tokenProvider.generateToken(
                user.getEmail(),
                user.getId(),
                roleName,
                user.getCustomerType().name()
        );

        return new AuthService.AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                roleName,
                user.getCustomerType()
        );
    }

    @Override
    @Transactional
    public PosCheckoutResult checkoutWalkIn(Long cashierUserId, List<PosCartItemDto> items,
                                            BigDecimal amountTendered, PaymentMethod paymentMethod) {
        return checkoutWalkIn(cashierUserId, null, items, amountTendered, paymentMethod);
    }

    @Override
    @Transactional
    public PosCheckoutResult checkoutWalkIn(Long cashierUserId, Long customerId, List<PosCartItemDto> items,
                                            BigDecimal amountTendered, PaymentMethod paymentMethod) {
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("Cart items cannot be empty for POS checkout.");
        }

        // CRITICAL BUSINESS RULE: Cashier must have an active OPEN shift to process transactions
        PosShift activeShift = posShiftRepository.findTopByCashier_IdAndStatusOrderByOpenedAtDesc(cashierUserId, PosShiftStatus.OPEN)
                .orElseThrow(() -> new BadRequestException("Cannot process POS checkout: No active shift is open. Please open a shift float first."));

        final PaymentMethod method = paymentMethod != null ? paymentMethod : PaymentMethod.CASH;

        User cashierUser = userRepository.findById(cashierUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Cashier staff not found with ID: " + cashierUserId));

        User customerUser = null;
        if (customerId != null) {
            customerUser = userRepository.findById(customerId).orElse(null);
        }

        record LineItemCalc(Product product, int quantity, BigDecimal unitPrice, BigDecimal lineSubtotal) {}
        List<LineItemCalc> lineCalculations = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (PosCartItemDto cartItem : items) {
            if (cartItem.quantity() <= 0) {
                throw new BadRequestException("Quantity must be greater than zero for product ID: " + cartItem.productId());
            }

            Product product = productRepository.findByIdAndIsDeletedFalse(cartItem.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Active product not found with ID: " + cartItem.productId()));

            int availableStock = batchAllocationService.getAvailableStock(product.getId());
            if (availableStock < cartItem.quantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for '" + product.getName() + "'. Available: " + availableStock + ", Requested: " + cartItem.quantity()
                );
            }

            // CRITICAL BUSINESS RULE: Strictly enforce RETAIL price. No wholesale allowed at POS walk-in.
            BigDecimal unitPrice = product.getRetailPrice();
            BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.quantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            subtotal = subtotal.add(lineSubtotal);
            lineCalculations.add(new LineItemCalc(product, cartItem.quantity(), unitPrice, lineSubtotal));
        }

        // 7% VAT standard retail tax
        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("0.07")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        BigDecimal finalAmountTendered = amountTendered;
        BigDecimal changeDue = BigDecimal.ZERO;

        if (method == PaymentMethod.CASH) {
            if (finalAmountTendered == null || finalAmountTendered.compareTo(grandTotal) < 0) {
                throw new InsufficientCashTenderedException(grandTotal, finalAmountTendered != null ? finalAmountTendered : BigDecimal.ZERO);
            }
            changeDue = finalAmountTendered.subtract(grandTotal).setScale(2, RoundingMode.HALF_UP);
        } else {
            finalAmountTendered = grandTotal;
        }

        String orderNumber = "POS-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .channel(OrderChannel.POS)
                .cashier(cashierUser)
                .user(customerUser != null ? customerUser : cashierUser)
                .shippingAddress("IN-STORE")
                .status(OrderStatus.PAID)
                .paymentMethod(method)
                .pricingTierUsed(CustomerType.RETAIL)
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .totalAmount(grandTotal)
                .build();

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> savedItems = new ArrayList<>();
        for (LineItemCalc calc : lineCalculations) {
            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(calc.product())
                    .quantity(calc.quantity())
                    .unitPrice(calc.unitPrice())
                    .subtotal(calc.lineSubtotal())
                    .build();

            OrderItem savedOrderItem = orderItemRepository.save(orderItem);
            savedItems.add(savedOrderItem);

            // Trigger FIFO / FEFO inventory allocation and deduction
            batchAllocationService.allocateAndDeductBatches(
                    savedOrderItem.getId(),
                    calc.product().getId(),
                    calc.quantity(),
                    cashierUserId,
                    TransactionType.POS_SALE.name()
            );
        }

        savedOrder.setItems(savedItems);

        // Update active cashier shift drawer stats
        activeShift.setTotalTransactions(activeShift.getTotalTransactions() + 1);
        if (method == PaymentMethod.CASH) {
            activeShift.setSystemCashTotal(activeShift.getSystemCashTotal().add(grandTotal));
        }
        posShiftRepository.save(activeShift);

        return new PosCheckoutResult(savedOrder, finalAmountTendered, changeDue);
    }

    @Override
    @Transactional(readOnly = true)
    public ThermalReceiptDto getReceipt(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("POS Order not found with number: " + orderNumber));

        List<OrderItem> items = orderItemRepository.findByOrder_Id(order.getId());
        if (items.isEmpty() && order.getItems() != null) {
            items = order.getItems();
        }

        List<ReceiptItemDto> receiptItems = items.stream()
                .map(i -> new ReceiptItemDto(
                        i.getProduct().getName(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.getSubtotal()
                ))
                .toList();

        String cashierName = order.getCashier() != null ? order.getCashier().getFullName() : "POS Staff";
        String formattedDate = order.getCreatedAt() != null
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        String barcodeData = "RCP*" + order.getOrderNumber() + "*V1";

        return new ThermalReceiptDto(
                "ONLINE RETAIL POS - STORE #01",
                "TERM-POS-01",
                cashierName,
                order.getOrderNumber(),
                formattedDate,
                receiptItems,
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getTotalAmount(),
                order.getTotalAmount(), // standard tender representation
                BigDecimal.ZERO,        // change settled at POS checkout
                barcodeData
        );
    }

    @Override
    @Transactional
    public PosShiftDto openShift(Long cashierId, BigDecimal openingFloat, String notes) {
        if (posShiftRepository.existsByCashier_IdAndStatus(cashierId, PosShiftStatus.OPEN)) {
            throw new BadRequestException("An active POS shift is already open for cashier ID: " + cashierId + ". Close the existing shift first.");
        }

        User cashier = userRepository.findById(cashierId)
                .orElseThrow(() -> new ResourceNotFoundException("Cashier user not found with ID: " + cashierId));

        PosShift shift = PosShift.builder()
                .cashier(cashier)
                .openedAt(LocalDateTime.now())
                .openingFloat(openingFloat != null ? openingFloat : BigDecimal.ZERO)
                .systemCashTotal(BigDecimal.ZERO)
                .totalTransactions(0)
                .status(PosShiftStatus.OPEN)
                .notes(notes)
                .build();

        PosShift saved = posShiftRepository.save(shift);
        return toShiftDto(saved);
    }

    @Override
    @Transactional
    public PosShiftDto closeShift(Long cashierId, BigDecimal closingCash, String notes) {
        PosShift shift = posShiftRepository.findTopByCashier_IdAndStatusOrderByOpenedAtDesc(cashierId, PosShiftStatus.OPEN)
                .orElseThrow(() -> new ResourceNotFoundException("No active open POS shift found for cashier ID: " + cashierId));

        BigDecimal actualClosing = closingCash != null ? closingCash : BigDecimal.ZERO;
        BigDecimal expectedDrawerTotal = shift.getOpeningFloat().add(shift.getSystemCashTotal());
        BigDecimal variance = actualClosing.subtract(expectedDrawerTotal);

        shift.setClosingCash(actualClosing);
        shift.setCashVariance(variance);
        shift.setClosedAt(LocalDateTime.now());
        shift.setStatus(PosShiftStatus.CLOSED);

        if (notes != null && !notes.isBlank()) {
            shift.setNotes(shift.getNotes() != null ? shift.getNotes() + " | " + notes : notes);
        }

        PosShift saved = posShiftRepository.save(shift);
        return toShiftDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PosShiftDto getCurrentShift(Long cashierId) {
        PosShift shift = posShiftRepository.findTopByCashier_IdAndStatusOrderByOpenedAtDesc(cashierId, PosShiftStatus.OPEN)
                .orElseThrow(() -> new ResourceNotFoundException("No active open shift found for cashier ID: " + cashierId));
        return toShiftDto(shift);
    }

    @Override
    @Transactional(readOnly = true)
    public PosProductScanDto scanProduct(String sku) {
        Product product = productRepository.findBySkuAndIsDeletedFalse(sku)
                .orElseThrow(() -> new ResourceNotFoundException("No active product found with barcode / SKU: " + sku));

        int availableStock = batchAllocationService.getAvailableStock(product.getId());

        return new PosProductScanDto(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getImageUrl(),
                product.getRetailPrice(),
                availableStock,
                Boolean.TRUE.equals(product.getIsPerishable())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<PosProductScanDto> getAllProducts() {
        return productRepository.findByIsDeletedFalseOrderByNameAsc().stream()
                .map(product -> new PosProductScanDto(
                        product.getId(),
                        product.getSku(),
                        product.getName(),
                        product.getImageUrl(),
                        product.getRetailPrice(),
                        batchAllocationService.getAvailableStock(product.getId()),
                        Boolean.TRUE.equals(product.getIsPerishable())
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PosSaleSummaryDto> getSalesHistory(Long cashierId, String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        LocalDateTime end = now.plusDays(1);

        String periodUpper = period != null ? period.toUpperCase() : "TODAY";
        switch (periodUpper) {
            case "TODAY" -> start = LocalDate.now().atStartOfDay();
            case "YESTERDAY" -> {
                start = LocalDate.now().minusDays(1).atStartOfDay();
                end = LocalDate.now().atStartOfDay();
            }
            case "WEEK" -> start = LocalDate.now().minusDays(7).atStartOfDay();
            case "MONTH" -> start = LocalDate.now().minusDays(30).atStartOfDay();
            case "ALL" -> start = LocalDateTime.of(2000, 1, 1, 0, 0);
            case "SHIFT" -> {
                Optional<PosShift> shiftOpt = cashierId != null
                        ? posShiftRepository.findTopByCashier_IdOrderByOpenedAtDesc(cashierId)
                        : Optional.empty();
                start = shiftOpt.map(PosShift::getOpenedAt).orElse(LocalDate.now().atStartOfDay());
            }
            default -> start = LocalDate.now().atStartOfDay();
        }

        List<Order> orders;
        if (cashierId != null) {
            orders = orderRepository.findByCashier_IdAndCreatedAtBetweenOrderByCreatedAtDesc(cashierId, start, end);
        } else {
            orders = orderRepository.findByChannelAndCreatedAtBetweenOrderByCreatedAtDesc(OrderChannel.POS, start, end);
        }

        return orders.stream()
                .map(this::toSaleSummaryDto)
                .toList();
    }

    private PosSaleSummaryDto toSaleSummaryDto(Order order) {
        String cashierName = order.getCashier() != null ? order.getCashier().getFullName() : "POS Staff";
        String customerName = order.getUser() != null ? order.getUser().getFullName() : "Walk-in Customer";
        int totalItemsCount = order.getItems() != null
                ? order.getItems().stream().mapToInt(OrderItem::getQuantity).sum()
                : 0;

        List<PosSaleItemDto> itemDtos = order.getItems() == null ? List.of() :
                order.getItems().stream()
                        .map(i -> new PosSaleItemDto(
                                i.getProduct() != null ? i.getProduct().getName() : "Unknown Item",
                                i.getQuantity(),
                                i.getUnitPrice(),
                                i.getSubtotal()
                        ))
                        .toList();

        return new PosSaleSummaryDto(
                order.getId(),
                order.getOrderNumber(),
                order.getCashier() != null ? order.getCashier().getId() : null,
                cashierName,
                customerName,
                order.getChannel() != null ? order.getChannel().name() : "POS",
                order.getPaymentMethod(),
                totalItemsCount,
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getTotalAmount(),
                order.getStatus() != null ? order.getStatus().name() : "PAID",
                order.getCreatedAt(),
                itemDtos
        );
    }

    private PosShiftDto toShiftDto(PosShift shift) {
        return new PosShiftDto(
                shift.getId(),
                shift.getCashier() != null ? shift.getCashier().getId() : null,
                shift.getCashier() != null ? shift.getCashier().getFullName() : "Unknown Staff",
                shift.getOpenedAt(),
                shift.getClosedAt(),
                shift.getOpeningFloat(),
                shift.getClosingCash(),
                shift.getSystemCashTotal(),
                shift.getCashVariance(),
                shift.getTotalTransactions() != null ? shift.getTotalTransactions() : 0,
                shift.getStatus(),
                shift.getNotes()
        );
    }
}

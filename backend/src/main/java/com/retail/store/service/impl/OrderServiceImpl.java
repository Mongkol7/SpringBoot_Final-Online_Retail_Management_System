package com.retail.store.service.impl;

import com.retail.store.entity.CartItem;
import com.retail.store.entity.Order;
import com.retail.store.entity.OrderItem;
import com.retail.store.entity.Product;
import com.retail.store.entity.User;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.OrderChannel;
import com.retail.store.entity.enums.OrderStatus;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.repository.CartItemRepository;
import com.retail.store.repository.OrderItemRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.service.BatchAllocationService;
import com.retail.store.service.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderServiceImpl implements OrderService {

    private static final BigDecimal BULK_RETAIL_DISCOUNT_FACTOR = BigDecimal.valueOf(0.95); // 5% discount
    private static final BigDecimal VAT_RATE = BigDecimal.valueOf(0.07); // 7% VAT standard
    private static final int DEFAULT_WHOLESALE_MIN_QTY = 10;
    private static final int RETAIL_BULK_MIN_QTY = 10;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final BatchAllocationService batchAllocationService;

    public OrderServiceImpl(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            ProductRepository productRepository,
                            UserRepository userRepository,
                            CartItemRepository cartItemRepository,
                            BatchAllocationService batchAllocationService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.cartItemRepository = cartItemRepository;
        this.batchAllocationService = batchAllocationService;
    }

    @Override
    public BigDecimal calculateUnitPrice(Product product, int quantity, CustomerType customerType, String batchPreference, int totalProductQuantity) {
        if (product == null) {
            throw new IllegalArgumentException("Product cannot be null");
        }

        int safeQuantity = Math.max(1, quantity);
        int qualifyingQty = totalProductQuantity > 0 ? totalProductQuantity : safeQuantity;

        BigDecimal retailPrice = product.getRetailPrice().setScale(2, RoundingMode.HALF_UP);
        BigDecimal wholesalePrice = product.getWholesalePrice() != null
                ? product.getWholesalePrice().setScale(2, RoundingMode.HALF_UP)
                : retailPrice;

        CustomerType safeCustomerType = customerType != null ? customerType : CustomerType.RETAIL;

        int minWholesaleQty = (product.getWholesaleMinQty() != null && product.getWholesaleMinQty() > 0)
                ? product.getWholesaleMinQty()
                : DEFAULT_WHOLESALE_MIN_QTY;

        boolean qualifiesForWholesale = (safeCustomerType == CustomerType.WHOLESALE) && (qualifyingQty >= minWholesaleQty);

        // If CLEARANCE / NEAR_EXPIRY batch preference was explicitly requested:
        if ("CLEARANCE".equalsIgnoreCase(batchPreference) || "NEAR_EXPIRY".equalsIgnoreCase(batchPreference)) {
            BigDecimal factor = BigDecimal.valueOf(0.75); // 25% OFF
            if (qualifiesForWholesale) {
                return wholesalePrice.multiply(factor).setScale(2, RoundingMode.HALF_UP);
            } else {
                return retailPrice.multiply(factor).setScale(2, RoundingMode.HALF_UP);
            }
        }

        // Case 1: User is WHOLESALE (standard or FRESH batch preference)
        if (safeCustomerType == CustomerType.WHOLESALE) {
            if (qualifiesForWholesale) {
                return wholesalePrice;
            } else {
                // Below MOQ across batches: standard retail price applies
                return retailPrice;
            }
        }

        // Case 2: User is RETAIL
        if (safeQuantity >= RETAIL_BULK_MIN_QTY) {
            // Bulk quantity (>= 10): Apply 5% minor bulk discount
            return retailPrice.multiply(BULK_RETAIL_DISCOUNT_FACTOR).setScale(2, RoundingMode.HALF_UP);
        }

        // Standard retail quantity (< 10 units)
        return retailPrice;
    }

    public BigDecimal calculateUnitPrice(Product product, int quantity, CustomerType customerType, String batchPreference) {
        return calculateUnitPrice(product, quantity, customerType, batchPreference, quantity);
    }

    @Override
    public BigDecimal calculateUnitPrice(Product product, int quantity, CustomerType customerType) {
        return calculateUnitPrice(product, quantity, customerType, null, quantity);
    }

    @Override
    @Transactional
    public Order createOrderFromCart(Long userId, String shippingAddress, PaymentMethod paymentMethod) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<CartItem> cartItems = cartItemRepository.findByUser_Id(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Cannot checkout with an empty cart");
        }

        List<OrderItemRequestDto> itemRequests = new ArrayList<>();
        for (CartItem ci : cartItems) {
            itemRequests.add(new OrderItemRequestDto(ci.getProduct().getId(), ci.getQuantity(), null));
        }

        Order order = executeOrderCreation(user, shippingAddress, paymentMethod, itemRequests);

        // Clear cart items on successful order placement
        cartItemRepository.deleteByUser_Id(userId);

        return order;
    }

    @Override
    @Transactional
    public Order createOrder(Long userId, String shippingAddress, PaymentMethod paymentMethod, List<OrderItemRequestDto> items) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (items == null || items.isEmpty()) {
            throw new IllegalStateException("Order must contain at least one line item");
        }

        Order order = executeOrderCreation(user, shippingAddress, paymentMethod, items);
        cartItemRepository.deleteByUser_Id(userId);
        return order;
    }

    private Order executeOrderCreation(User user,
                                       String shippingAddress,
                                       PaymentMethod paymentMethod,
                                       List<OrderItemRequestDto> items) {
        // 1. Generate unique orderNumber (e.g. ORD-YYYYMMDD-XXXX)
        String datePart = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String orderNumber = "ORD-" + datePart + "-" + randomSuffix;

        // 2. Aggregate total product quantities across lines (e.g. fresh + clearance of same product count together toward wholesale MOQ)
        Map<Long, Integer> productTotals = new HashMap<>();
        for (OrderItemRequestDto itemReq : items) {
            productTotals.merge(itemReq.productId(), itemReq.quantity(), Integer::sum);
        }

        // 3. Server-side Line Item Pricing & Stock Validation
        BigDecimal subtotal = BigDecimal.ZERO;
        List<VerifiedLineItem> verifiedItems = new ArrayList<>();

        for (OrderItemRequestDto itemReq : items) {
            Product product = productRepository.findByIdAndIsDeletedFalse(itemReq.productId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + itemReq.productId()));

            int quantity = itemReq.quantity();
            if (quantity <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than 0 for product: " + product.getName());
            }

            // Verify stock availability
            int availableStock = batchAllocationService.getAvailableStock(product.getId());
            if (availableStock < quantity) {
                throw new IllegalStateException("Insufficient stock for product " + product.getName()
                        + " (Available: " + availableStock + ", Requested: " + quantity + ")");
            }

            int totalProductQty = productTotals.getOrDefault(itemReq.productId(), quantity);

            // Recalculate tiered unit price on server side with cross-batch aggregation
            BigDecimal unitPrice = calculateUnitPrice(product, quantity, user.getCustomerType(), itemReq.batchPreference(), totalProductQty);
            BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);

            subtotal = subtotal.add(lineSubtotal);
            verifiedItems.add(new VerifiedLineItem(product, quantity, unitPrice, lineSubtotal, itemReq.batchPreference()));
        }

        // 3. Financial Totals (Subtotal, 7% VAT, Total)
        BigDecimal taxAmount = subtotal.multiply(VAT_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        // 4. Save Order
        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setChannel(OrderChannel.ONLINE);
        order.setUser(user);
        order.setShippingAddress(shippingAddress != null && !shippingAddress.isBlank()
                ? shippingAddress
                : "Standard Customer Delivery Address");
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(paymentMethod != null ? paymentMethod : PaymentMethod.CARD);
        order.setPricingTierUsed(user.getCustomerType());
        order.setSubtotal(subtotal);
        order.setTaxAmount(taxAmount);
        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);

        // 5. Save OrderItems and Execute FIFO/FEFO Allocation
        List<OrderItem> savedItemsList = new ArrayList<>();
        for (VerifiedLineItem item : verifiedItems) {
            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(item.product())
                    .quantity(item.quantity())
                    .unitPrice(item.unitPrice())
                    .subtotal(item.subtotal())
                    .build();

            OrderItem savedOrderItem = orderItemRepository.save(orderItem);

            // FIFO / FEFO Batch Allocation with Wholesale Fresh Preference
            boolean preferFresh = "FRESH".equalsIgnoreCase(item.batchPreference()) ||
                    (user.getCustomerType() == CustomerType.WHOLESALE && !"CLEARANCE".equalsIgnoreCase(item.batchPreference()) && !"NEAR_EXPIRY".equalsIgnoreCase(item.batchPreference()));

            batchAllocationService.allocateAndDeductBatches(
                    savedOrderItem.getId(),
                    item.product().getId(),
                    item.quantity(),
                    user.getId(),
                    "ONLINE_SALE",
                    preferFresh
            );

            savedItemsList.add(savedOrderItem);
        }

        if (savedOrder.getItems() == null) {
            savedOrder.setItems(new ArrayList<>(savedItemsList));
        } else {
            savedOrder.getItems().clear();
            savedOrder.getItems().addAll(savedItemsList);
        }
        return savedOrder;
    }

    private record VerifiedLineItem(
            Product product,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal,
            String batchPreference
    ) {}
}

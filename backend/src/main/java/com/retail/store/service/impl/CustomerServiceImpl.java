package com.retail.store.service.impl;

import com.retail.store.entity.CartItem;
import com.retail.store.entity.Order;
import com.retail.store.entity.OrderItem;
import com.retail.store.entity.Product;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.entity.ProductBatch;
import com.retail.store.repository.CartItemRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductBatchRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.repository.WholesaleApplicationRepository;
import com.retail.store.service.BatchAllocationService;
import com.retail.store.service.CustomerService;
import com.retail.store.service.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import com.retail.store.entity.enums.ApplicationStatus;
import com.retail.store.entity.enums.CustomerType;

/**
 * =========================================================================
 * 👤 ASSIGNED TO: PERSON 1 (USER / Customer Role)
 * =========================================================================
 * Responsibilities:
 * 1. Cart Management (Add, view, remove, clear, calculate cart total).
 * 2. Dynamic Price Resolution:
 *    - RETAIL customers pay product.getRetailPrice().
 *    - WHOLESALE customers pay product.getWholesalePrice().
 * 3. Online Checkout:
 *    - Validate cart is not empty.
 *    - Calculate subtotal, 7% VAT, and total.
 *    - Create Order (channel = ONLINE, cashier = null, status = PAID).
 *    - Deduct batch inventory via BatchAllocationService.
 *    - Clear cart upon successful checkout.
 * 4. Order Tracking & Cancellation (with inventory restoration).
 * 5. Wholesale Application submission and status checking.
 * =========================================================================
 */
@Service
public class CustomerServiceImpl implements CustomerService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository batchRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final WholesaleApplicationRepository wholesaleRepository;
    private final BatchAllocationService batchAllocationService;
    private final OrderService orderService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public CustomerServiceImpl(CartItemRepository cartItemRepository,
                               ProductRepository productRepository,
                               ProductBatchRepository batchRepository,
                               UserRepository userRepository,
                               OrderRepository orderRepository,
                               WholesaleApplicationRepository wholesaleRepository,
                               BatchAllocationService batchAllocationService,
                               OrderService orderService,
                               org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.batchRepository = batchRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.wholesaleRepository = wholesaleRepository;
        this.batchAllocationService = batchAllocationService;
        this.orderService = orderService;
        this.passwordEncoder = passwordEncoder != null ? passwordEncoder : new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(12);
    }

    @Override
    @Transactional
    public CartItem addToCart(Long userId, Long productId, int quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        Product product = productRepository.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        int availableStock = batchAllocationService.getAvailableStock(productId);
        if (availableStock < quantity) {
            throw new IllegalStateException("Insufficient stock for product " + product.getName()
                    + " (Available: " + availableStock + ", Requested: " + quantity + ")");
        }

        Optional<CartItem> existing = cartItemRepository.findByUser_IdAndProduct_Id(userId, productId);
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + quantity);
            return cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(quantity)
                    .build();
            return cartItemRepository.save(item);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartItem> getCart(Long userId) {
        return cartItemRepository.findByUser_Id(userId);
    }

    @Override
    @Transactional
    public void removeFromCart(Long userId, Long cartItemId) {
        cartItemRepository.findById(cartItemId).ifPresent(item -> {
            if (item.getUser() != null && item.getUser().getId().equals(userId)) {
                cartItemRepository.delete(item);
            }
        });
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUser_Id(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getCartTotal(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return BigDecimal.ZERO;

        List<CartItem> cartItems = cartItemRepository.findByUser_Id(userId);
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem ci : cartItems) {
            BigDecimal unitPrice = orderService.calculateUnitPrice(ci.getProduct(), ci.getQuantity(), user.getCustomerType());
            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(ci.getQuantity())));
        }
        return subtotal.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    @Override
    @Transactional
    public Order checkoutOnline(Long userId, String shippingAddress, PaymentMethod paymentMethod) {
        return orderService.createOrderFromCart(userId, shippingAddress, paymentMethod);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> getCustomerOrders(Long userId) {
        List<Order> orders = orderRepository.findByUser_Id(userId, org.springframework.data.domain.PageRequest.of(0, 50, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))).getContent();
        for (Order o : orders) {
            if (o.getItems() != null) {
                o.getItems().size();
                for (OrderItem item : o.getItems()) {
                    enrichOrderItemBatchAndExpiry(item);
                }
            }
        }
        return orders;
    }

    @Override
    @Transactional(readOnly = true)
    public Order getOrderDetails(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber).orElse(null);
        if (order != null && order.getItems() != null) {
            order.getItems().size();
            for (OrderItem item : order.getItems()) {
                enrichOrderItemBatchAndExpiry(item);
            }
        }
        return order;
    }

    private void enrichOrderItemBatchAndExpiry(OrderItem item) {
        if (item == null) return;
        if (item.getProduct() != null) {
            enrichProductBatchAndExpiry(item.getProduct());
        }

        LocalDate itemExp = null;
        if (item.getBatchFulfillments() != null && !item.getBatchFulfillments().isEmpty()) {
            itemExp = item.getBatchFulfillments().stream()
                    .filter(bf -> bf.getBatch() != null && bf.getBatch().getExpiryDate() != null)
                    .map(bf -> bf.getBatch().getExpiryDate())
                    .sorted()
                    .findFirst()
                    .orElse(null);
        }

        if (item.getProduct() != null) {
            BigDecimal retail = item.getProduct().getRetailPrice();
            BigDecimal wholesale = item.getProduct().getWholesalePrice();
            BigDecimal unit = item.getUnitPrice();
            boolean isItemWholesale = item.getOrder() != null
                    && item.getOrder().getPricingTierUsed() == com.retail.store.entity.enums.CustomerType.WHOLESALE
                    && item.getQuantity() != null && item.getQuantity() >= 10;

            boolean isClearancePricing = false;
            if (isItemWholesale) {
                if (wholesale != null && unit != null && wholesale.compareTo(BigDecimal.ZERO) > 0) {
                    if (unit.compareTo(wholesale.subtract(new BigDecimal("0.05"))) < 0) {
                        isClearancePricing = true;
                    }
                }
                if (!isClearancePricing && retail != null && unit != null && retail.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal diff = retail.subtract(unit);
                    if (diff.compareTo(BigDecimal.ZERO) > 0 && diff.divide(retail, 2, RoundingMode.HALF_UP).compareTo(new BigDecimal("0.45")) >= 0) {
                        isClearancePricing = true;
                    }
                }
            } else {
                if (retail != null && unit != null && retail.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal diff = retail.subtract(unit);
                    if (diff.compareTo(BigDecimal.ZERO) > 0 && diff.divide(retail, 2, RoundingMode.HALF_UP).compareTo(new BigDecimal("0.20")) >= 0) {
                        isClearancePricing = true;
                    }
                }
            }

            if ("CLEARANCE".equalsIgnoreCase(item.getBatchPreference())) {
                isClearancePricing = true;
            }

            if (isClearancePricing) {
                item.setBatchPreference("CLEARANCE");
                if (itemExp == null || itemExp.isAfter(LocalDate.now().plusDays(30))) {
                    if (item.getProduct().getCurrentBatchExpiryDate() != null) {
                        try {
                            itemExp = LocalDate.parse(item.getProduct().getCurrentBatchExpiryDate());
                        } catch (Exception ignored) {}
                    }
                    if (itemExp == null) {
                        itemExp = LocalDate.now().plusDays(24);
                    }
                }
            } else {
                item.setBatchPreference("FRESH");
                if (itemExp == null || !itemExp.isAfter(LocalDate.now().plusDays(30))) {
                    if (item.getProduct().getFreshBatchExpiryDate() != null) {
                        try {
                            itemExp = LocalDate.parse(item.getProduct().getFreshBatchExpiryDate());
                        } catch (Exception ignored) {}
                    } else if (item.getProduct().getCurrentBatchExpiryDate() != null) {
                        try {
                            LocalDate cb = LocalDate.parse(item.getProduct().getCurrentBatchExpiryDate());
                            if (cb.isAfter(LocalDate.now().plusDays(30))) {
                                itemExp = cb;
                            } else {
                                itemExp = LocalDate.now().plusMonths(6);
                            }
                        } catch (Exception ignored) {
                            itemExp = LocalDate.now().plusMonths(6);
                        }
                    } else {
                        itemExp = LocalDate.now().plusMonths(6);
                    }
                }
            }
        }

        item.setExpiryDate(itemExp);
    }

    @Override
    @Transactional
    public void cancelOrder(Long userId, String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseGet(() -> {
                    try {
                        Long id = Long.valueOf(orderNumber);
                        return orderRepository.findById(id).orElse(null);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                });

        if (order == null) {
            throw new RuntimeException("Order not found: " + orderNumber);
        }
        if (order.getUser() != null && !order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied: Order does not belong to user");
        }
        if (order.getStatus() != com.retail.store.entity.enums.OrderStatus.PENDING) {
            throw new RuntimeException("Only PENDING orders can be cancelled. Current status: " + order.getStatus());
        }

        // 4-Hour Cancellation Window: Customers can only cancel within 4 hours of placing the order
        if (order.getCreatedAt() != null) {
            java.time.LocalDateTime fourHoursAgo = java.time.LocalDateTime.now().minusHours(4);
            if (order.getCreatedAt().isBefore(fourHoursAgo)) {
                throw new RuntimeException("Cancellation window expired: Orders can only be cancelled within 4 hours of placement.");
            }
        }

        order.setStatus(com.retail.store.entity.enums.OrderStatus.CANCELLED);
        orderRepository.save(order);

        if (order.getItems() != null) {
            for (com.retail.store.entity.OrderItem item : order.getItems()) {
                try {
                    batchAllocationService.restoreStockForOrderItem(item.getId(), userId);
                } catch (Exception ignored) {}
            }
        }
    }

    @Override
    @Transactional
    public Order confirmOrder(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseGet(() -> {
                    try {
                        Long id = Long.parseLong(orderNumber);
                        return orderRepository.findById(id).orElse(null);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                });
        if (order != null) {
            order.setStatus(com.retail.store.entity.enums.OrderStatus.PROCESSING);
            return orderRepository.save(order);
        }
        return null;
    }

    @Override
    @Transactional
    public WholesaleApplication applyForWholesale(Long userId, String businessName, String taxId) {
        com.retail.store.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        WholesaleApplication app = WholesaleApplication.builder()
                .user(user)
                .businessName(businessName)
                .taxIdOrLicense(taxId)
                .status(com.retail.store.entity.enums.ApplicationStatus.PENDING)
                .build();

        return wholesaleRepository.save(app);
    }

    @Override
    @Transactional
    public WholesaleApplication getWholesaleStatus(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        Optional<WholesaleApplication> appOpt = wholesaleRepository.findTopByUser_IdOrderByCreatedAtDesc(userId);
        if (appOpt.isPresent()) {
            WholesaleApplication app = appOpt.get();
            if (user != null && user.getCustomerType() == CustomerType.WHOLESALE && app.getStatus() == ApplicationStatus.PENDING) {
                app.setStatus(ApplicationStatus.APPROVED);
                app.setReviewedAt(LocalDateTime.now());
                app.setAdminNotes("Auto-verified Wholesale Tier");
                return wholesaleRepository.save(app);
            }
            return app;
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.retail.store.entity.Product> getAvailableProducts() {
        List<com.retail.store.entity.Product> products = productRepository.findByIsDeletedFalseOrderByNameAsc();
        for (com.retail.store.entity.Product p : products) {
            enrichProductBatchAndExpiry(p);
        }
        return products;
    }

    @Override
    @Transactional(readOnly = true)
    public com.retail.store.entity.Product getProductById(Long id) {
        com.retail.store.entity.Product product = productRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new com.retail.store.exception.ResourceNotFoundException("Product not found with id: " + id));
        enrichProductBatchAndExpiry(product);
        return product;
    }

    private void enrichProductBatchAndExpiry(com.retail.store.entity.Product p) {
        if (p == null) return;
        p.setStockQuantity(batchAllocationService.getAvailableStock(p.getId()));

        List<ProductBatch> activeBatches;
        if (Boolean.TRUE.equals(p.getIsPerishable())) {
            activeBatches = batchRepository.findActiveBatchesFEFO(p.getId(), LocalDate.now());
        } else {
            activeBatches = batchRepository.findActiveBatchesFIFO(p.getId());
        }

        LocalDate now = LocalDate.now();
        LocalDate oneMonthLater = now.plusDays(30);

        if (!activeBatches.isEmpty()) {
            ProductBatch firstBatch = activeBatches.get(0);
            p.setBatchCode(firstBatch.getBatchCode());

            LocalDate expDate = firstBatch.getExpiryDate();
            if (expDate != null) {
                p.setCurrentBatchExpiryDate(expDate.toString());
                long days = ChronoUnit.DAYS.between(now, expDate);
                p.setDaysUntilExpiry((int) Math.max(0, days));
            }

            int nearExpiryUnits = 0;
            int freshUnits = 0;
            String freshExpiry = null;
            String freshCode = null;

            for (ProductBatch b : activeBatches) {
                if (b.getCurrentQuantity() <= 0) continue;
                boolean isNearExpiry = b.getExpiryDate() != null && !b.getExpiryDate().isAfter(oneMonthLater);
                if (isNearExpiry) {
                    nearExpiryUnits += b.getCurrentQuantity();
                } else {
                    freshUnits += b.getCurrentQuantity();
                    if (freshCode == null) {
                        freshCode = b.getBatchCode();
                        if (b.getExpiryDate() != null) {
                            freshExpiry = b.getExpiryDate().toString();
                        }
                    }
                }
            }

            p.setNearExpiryQuantity(nearExpiryUnits);
            p.setFreshStockQuantity(freshUnits);
            p.setFreshBatchExpiryDate(freshExpiry);
            p.setFreshBatchCode(freshCode);

            if (nearExpiryUnits > 0) {
                // 25% clearance discount for near-expiry units (< 1 month)
                p.setClearanceDiscountPercent(BigDecimal.valueOf(25));
                BigDecimal factor = BigDecimal.valueOf(0.75);
                if (p.getRetailPrice() != null) {
                    p.setClearancePrice(p.getRetailPrice().multiply(factor).setScale(2, RoundingMode.HALF_UP));
                }
                if (p.getWholesalePrice() != null) {
                    p.setWholesaleClearancePrice(p.getWholesalePrice().multiply(factor).setScale(2, RoundingMode.HALF_UP));
                }
            } else {
                p.setClearanceDiscountPercent(BigDecimal.ZERO);
                p.setClearancePrice(p.getRetailPrice());
                p.setWholesaleClearancePrice(p.getWholesalePrice());
            }
        } else {
            p.setNearExpiryQuantity(0);
            p.setFreshStockQuantity(0);
            p.setClearanceDiscountPercent(BigDecimal.ZERO);
            p.setClearancePrice(p.getRetailPrice());
            p.setWholesaleClearancePrice(p.getWholesalePrice());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public User getCustomerProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new com.retail.store.exception.ResourceNotFoundException("User not found with id: " + userId));
    }

    @Override
    @Transactional
    public User updateCustomerProfile(Long userId, String fullName, String phone, String addressesJson, String newPassword) {
        return updateCustomerProfile(userId, fullName, phone, addressesJson, newPassword, null, null);
    }

    @Override
    @Transactional
    public User updateCustomerProfile(Long userId, String fullName, String phone, String addressesJson, String newPassword, String avatarUrl, String companyName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.retail.store.exception.ResourceNotFoundException("User not found with id: " + userId));

        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
        }
        if (phone != null) {
            user.setPhone(phone.trim());
        }
        if (addressesJson != null && !addressesJson.trim().isEmpty()) {
            user.setAddresses(addressesJson.trim());
        }
        if (avatarUrl != null && !avatarUrl.trim().isEmpty()) {
            user.setAvatarUrl(avatarUrl.trim());
        }
        if (companyName != null) {
            user.setCompanyName(companyName.trim());
        }
        if (newPassword != null && !newPassword.trim().isEmpty() && newPassword.trim().length() >= 4) {
            user.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        }
        return userRepository.save(user);
    }
}

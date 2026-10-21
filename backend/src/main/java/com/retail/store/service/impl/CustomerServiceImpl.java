package com.retail.store.service.impl;

import com.retail.store.entity.CartItem;
import com.retail.store.entity.Order;
import com.retail.store.entity.Product;
import com.retail.store.entity.User;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.repository.CartItemRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.repository.WholesaleApplicationRepository;
import com.retail.store.service.BatchAllocationService;
import com.retail.store.service.CustomerService;
import com.retail.store.service.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final WholesaleApplicationRepository wholesaleRepository;
    private final BatchAllocationService batchAllocationService;
    private final OrderService orderService;

    public CustomerServiceImpl(CartItemRepository cartItemRepository,
                               ProductRepository productRepository,
                               UserRepository userRepository,
                               OrderRepository orderRepository,
                               WholesaleApplicationRepository wholesaleRepository,
                               BatchAllocationService batchAllocationService,
                               OrderService orderService) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.wholesaleRepository = wholesaleRepository;
        this.batchAllocationService = batchAllocationService;
        this.orderService = orderService;
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
        return orderRepository.findByUser_Id(userId, org.springframework.data.domain.PageRequest.of(0, 50, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))).getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public Order getOrderDetails(String orderNumber) {
        // TODO [Person 1]: Fetch order details by orderNumber from orderRepository
        return orderRepository.findByOrderNumber(orderNumber).orElse(null);
    }

    @Override
    @Transactional
    public void cancelOrder(Long userId, String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseGet(() -> {
                    try {
                        Long id = Long.parseLong(orderNumber);
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
        List<com.retail.store.entity.Product> products = productRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                .toList();
        for (com.retail.store.entity.Product p : products) {
            p.setStockQuantity(batchAllocationService.getAvailableStock(p.getId()));
        }
        return products;
    }
}

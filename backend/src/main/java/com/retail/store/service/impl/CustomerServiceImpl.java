package com.retail.store.service.impl;

import com.retail.store.entity.CartItem;
import com.retail.store.entity.Order;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.repository.CartItemRepository;
import com.retail.store.repository.OrderRepository;
import com.retail.store.repository.ProductRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.repository.WholesaleApplicationRepository;
import com.retail.store.service.BatchAllocationService;
import com.retail.store.service.CustomerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

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

    public CustomerServiceImpl(CartItemRepository cartItemRepository,
                               ProductRepository productRepository,
                               UserRepository userRepository,
                               OrderRepository orderRepository,
                               WholesaleApplicationRepository wholesaleRepository,
                               BatchAllocationService batchAllocationService) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.wholesaleRepository = wholesaleRepository;
        this.batchAllocationService = batchAllocationService;
    }

    @Override
    @Transactional
    public CartItem addToCart(Long userId, Long productId, int quantity) {
        // TODO [Person 1]: Validate stock availability using batchAllocationService.getAvailableStock(productId)
        // TODO [Person 1]: Check if product already exists in user's cart; if so, update quantity, else create new CartItem
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartItem> getCart(Long userId) {
        // TODO [Person 1]: Fetch user cart items using cartItemRepository.findByUser_Id(userId)
        return cartItemRepository.findByUser_Id(userId);
    }

    @Override
    @Transactional
    public void removeFromCart(Long userId, Long cartItemId) {
        // TODO [Person 1]: Verify cart item ownership by userId and remove from cartItemRepository
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        // TODO [Person 1]: Delete all cart items for this user using cartItemRepository.deleteByUser_Id(userId)
        cartItemRepository.deleteByUser_Id(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getCartTotal(Long userId) {
        // TODO [Person 1]: Sum (unit_price * quantity) for all items in user's cart
        // Note: Check user.getCustomerType() to use retail_price vs wholesale_price
        return BigDecimal.ZERO;
    }

    @Override
    @Transactional
    public Order checkoutOnline(Long userId, String shippingAddress, PaymentMethod paymentMethod) {
        // TODO [Person 1]: 1. Check cart is not empty
        // TODO [Person 1]: 2. Generate unique orderNumber (e.g. ORD-YYYYMMDD-XXXX)
        // TODO [Person 1]: 3. Calculate subtotal, 7% tax, and total
        // TODO [Person 1]: 4. Save Order (channel = ONLINE, pricingTierUsed = user.customerType)
        // TODO [Person 1]: 5. Save OrderItems and call batchAllocationService.allocateAndDeductBatches()
        // TODO [Person 1]: 6. Clear user cart
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> getCustomerOrders(Long userId) {
        // TODO [Person 1]: Return customer order history using orderRepository.findByUser_Id()
        return Collections.emptyList();
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
        // TODO [Person 1]: Validate order belongs to user and is eligible for cancellation
        // TODO [Person 1]: Set status = CANCELLED
        // TODO [Person 1]: Call batchAllocationService.restoreStockForOrderItem() for each item
    }

    @Override
    @Transactional
    public WholesaleApplication applyForWholesale(Long userId, String businessName, String taxId) {
        // TODO [Person 1]: Create and persist WholesaleApplication with status = PENDING
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public WholesaleApplication getWholesaleStatus(Long userId) {
        // TODO [Person 1]: Query wholesaleRepository for user's latest application
        return wholesaleRepository.findTopByUser_IdOrderByCreatedAtDesc(userId).orElse(null);
    }
}

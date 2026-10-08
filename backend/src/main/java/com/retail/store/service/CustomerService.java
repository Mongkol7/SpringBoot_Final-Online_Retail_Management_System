package com.retail.store.service;

import com.retail.store.entity.CartItem;
import com.retail.store.entity.Order;
import com.retail.store.entity.WholesaleApplication;
import com.retail.store.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.List;

public interface CustomerService {
    CartItem addToCart(Long userId, Long productId, int quantity);
    List<CartItem> getCart(Long userId);
    void removeFromCart(Long userId, Long cartItemId);
    void clearCart(Long userId);
    BigDecimal getCartTotal(Long userId);

    Order checkoutOnline(Long userId, String shippingAddress, PaymentMethod paymentMethod);
    List<Order> getCustomerOrders(Long userId);
    Order getOrderDetails(String orderNumber);
    void cancelOrder(Long userId, String orderNumber);

    WholesaleApplication applyForWholesale(Long userId, String businessName, String taxId);
    WholesaleApplication getWholesaleStatus(Long userId);
}

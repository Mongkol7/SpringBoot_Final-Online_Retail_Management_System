package com.retail.store.service;

import com.retail.store.entity.Order;
import com.retail.store.entity.Product;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.List;

public interface OrderService {

    /**
     * Calculates the tiered unit price for a given product, quantity, and customer classification:
     * 1. User is WHOLESALE:
     *    - item.quantity >= product.getWholesaleMinQty() (default 10):
     *        -> unitPrice = product.getWholesalePrice()
     *    - item.quantity < product.getWholesaleMinQty():
     *        -> unitPrice = product.getRetailPrice() (retained retail price)
     * 2. User is RETAIL:
     *    - item.quantity >= 10:
     *        -> unitPrice = product.getRetailPrice() * 0.95 (5% minor bulk discount)
     *    - item.quantity < 10:
     *        -> unitPrice = product.getRetailPrice()
     */
    BigDecimal calculateUnitPrice(Product product, int quantity, CustomerType customerType);

    /**
     * Creates an online customer order from the active cart items.
     * Enforces server-side recalculation of line items, subtotal, 7% VAT, and totalAmount,
     * followed by FIFO/FEFO batch allocation and cart clearance.
     */
    Order createOrderFromCart(Long userId, String shippingAddress, PaymentMethod paymentMethod);

    /**
     * Creates an online order from explicit line items with server-side pricing integrity.
     */
    Order createOrder(Long userId, String shippingAddress, PaymentMethod paymentMethod, List<OrderItemRequestDto> items);

    record OrderItemRequestDto(
            Long productId,
            int quantity
    ) {}
}

package com.retail.store.dto.cashier.response;

import com.retail.store.entity.OrderItem;

import java.math.BigDecimal;

public record PosOrderItemResponse(
        Long id,
        Long productId,
        String productName,
        String sku,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
    public static PosOrderItemResponse from(OrderItem item) {
        if (item == null) return null;
        return new PosOrderItemResponse(
                item.getId(),
                item.getProduct() != null ? item.getProduct().getId() : null,
                item.getProduct() != null ? item.getProduct().getName() : null,
                item.getProduct() != null ? item.getProduct().getSku() : null,
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
        );
    }
}

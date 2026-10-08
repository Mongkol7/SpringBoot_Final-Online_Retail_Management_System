package com.retail.store.dto.cashier.response;

import com.retail.store.entity.Order;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.entity.enums.OrderChannel;
import com.retail.store.entity.enums.OrderStatus;
import com.retail.store.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PosOrderResponse(
        Long id,
        String orderNumber,
        OrderChannel channel,
        Long cashierId,
        CustomerType pricingTierUsed,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        OrderStatus status,
        PaymentMethod paymentMethod,
        LocalDateTime createdAt,
        List<PosOrderItemResponse> items
) {
    public static PosOrderResponse from(Order order) {
        if (order == null) return null;
        List<PosOrderItemResponse> itemDtos = (order.getItems() == null) ? List.of() :
                order.getItems().stream()
                        .map(PosOrderItemResponse::from)
                        .toList();

        Long cashierId = (order.getCashier() != null) ? order.getCashier().getId() : null;

        return new PosOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getChannel(),
                cashierId,
                order.getPricingTierUsed(),
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getCreatedAt(),
                itemDtos
        );
    }
}

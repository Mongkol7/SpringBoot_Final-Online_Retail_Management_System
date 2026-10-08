package com.retail.store.dto.cashier.response;

import com.retail.store.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PosSaleSummaryResponse(
        Long id,
        String orderNumber,
        Long cashierId,
        String cashierName,
        String customerName,
        String channel,
        PaymentMethod paymentMethod,
        int totalItemsCount,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String status,
        LocalDateTime createdAt,
        List<PosSaleItemResponse> items
) {
    public record PosSaleItemResponse(
            String productName,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal
    ) {}
}

package com.retail.store.dto.cashier.response;

import com.retail.store.service.CashierService;

import java.math.BigDecimal;

public record ReceiptItemResponse(
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
    public static ReceiptItemResponse from(CashierService.ReceiptItemDto dto) {
        if (dto == null) return null;
        return new ReceiptItemResponse(
                dto.productName(),
                dto.quantity(),
                dto.unitPrice(),
                dto.subtotal()
        );
    }
}

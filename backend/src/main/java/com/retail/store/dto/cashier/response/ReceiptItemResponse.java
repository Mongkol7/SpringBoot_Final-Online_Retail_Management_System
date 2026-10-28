package com.retail.store.dto.cashier.response;

import com.retail.store.service.CashierService;

import java.math.BigDecimal;

public record ReceiptItemResponse(
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal,
        String batchPreference,
        String expiryDate,
        Boolean isClearance,
        String expiryStatus
) {
    public ReceiptItemResponse(String productName, int quantity, BigDecimal unitPrice, BigDecimal subtotal) {
        this(productName, quantity, unitPrice, subtotal, null, null, false, null);
    }

    public static ReceiptItemResponse from(CashierService.ReceiptItemDto dto) {
        if (dto == null) return null;
        return new ReceiptItemResponse(
                dto.productName(),
                dto.quantity(),
                dto.unitPrice(),
                dto.subtotal(),
                dto.batchPreference(),
                dto.expiryDate(),
                dto.isClearance(),
                dto.expiryStatus()
        );
    }
}

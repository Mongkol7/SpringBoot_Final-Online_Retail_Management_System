package com.retail.store.dto.cashier.response;

import com.retail.store.service.CashierService;

import java.math.BigDecimal;
import java.util.List;

public record ThermalReceiptResponse(
        String storeName,
        String terminalId,
        String cashierName,
        String orderNumber,
        String dateTime,
        List<ReceiptItemResponse> items,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal grandTotal,
        BigDecimal amountTendered,
        BigDecimal changeDue,
        String barcodeData
) {
    public static ThermalReceiptResponse from(CashierService.ThermalReceiptDto dto) {
        if (dto == null) return null;
        List<ReceiptItemResponse> itemResponses = dto.items() == null ? List.of() :
                dto.items().stream()
                        .map(ReceiptItemResponse::from)
                        .toList();

        return new ThermalReceiptResponse(
                dto.storeName(),
                dto.terminalId(),
                dto.cashierName(),
                dto.orderNumber(),
                dto.dateTime(),
                itemResponses,
                dto.subtotal(),
                dto.taxAmount(),
                dto.grandTotal(),
                dto.amountTendered(),
                dto.changeDue(),
                dto.barcodeData()
        );
    }
}

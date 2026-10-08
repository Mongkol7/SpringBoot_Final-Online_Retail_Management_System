package com.retail.store.service;

import com.retail.store.entity.Order;
import com.retail.store.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.List;

public interface CashierService {
    PosCheckoutResult checkoutWalkIn(Long cashierUserId, List<PosCartItemDto> items,
                                    BigDecimal amountTendered, PaymentMethod paymentMethod);
    ThermalReceiptDto getReceipt(String orderNumber);

    record PosCartItemDto(Long productId, int quantity) {}

    record PosCheckoutResult(
            Order order,
            BigDecimal amountTendered,
            BigDecimal changeDue
    ) {}

    record ThermalReceiptDto(
            String storeName,
            String terminalId,
            String cashierName,
            String orderNumber,
            String dateTime,
            List<ReceiptItemDto> items,
            BigDecimal subtotal,
            BigDecimal taxAmount,
            BigDecimal grandTotal,
            BigDecimal amountTendered,
            BigDecimal changeDue,
            String barcodeData
    ) {}

    record ReceiptItemDto(
            String productName,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal
    ) {}
}

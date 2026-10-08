package com.retail.store.service;

import com.retail.store.entity.Order;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.entity.enums.PosShiftStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface CashierService {

    AuthService.AuthResponse login(String email, String password);

    PosCheckoutResult checkoutWalkIn(Long cashierUserId, List<PosCartItemDto> items,
                                    BigDecimal amountTendered, PaymentMethod paymentMethod);

    PosCheckoutResult checkoutWalkIn(Long cashierUserId, Long customerId, List<PosCartItemDto> items,
                                    BigDecimal amountTendered, PaymentMethod paymentMethod);

    ThermalReceiptDto getReceipt(String orderNumber);

    PosShiftDto openShift(Long cashierId, BigDecimal openingFloat, String notes);

    PosShiftDto closeShift(Long cashierId, BigDecimal closingCash, String notes);

    PosShiftDto getCurrentShift(Long cashierId);

    PosProductScanDto scanProduct(String sku);

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

    record PosShiftDto(
            Long id,
            Long cashierId,
            String cashierName,
            LocalDateTime openedAt,
            LocalDateTime closedAt,
            BigDecimal openingFloat,
            BigDecimal closingCash,
            BigDecimal systemCashTotal,
            BigDecimal cashVariance,
            int totalTransactions,
            PosShiftStatus status,
            String notes
    ) {}

    record PosProductScanDto(
            Long id,
            String sku,
            String name,
            BigDecimal retailPrice,
            int availableStock,
            boolean isPerishable
    ) {}
}

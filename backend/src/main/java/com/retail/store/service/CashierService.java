package com.retail.store.service;

import com.retail.store.entity.Order;
import com.retail.store.entity.enums.PaymentMethod;
import com.retail.store.entity.enums.PosShiftStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface CashierService {

    AuthService.AuthResponse login(String email, String password);

    List<CashierStaffDto> getCashierStaffList();

    AuthService.AuthResponse loginWithPin(Long cashierId, String pin);

    PosCheckoutResult checkoutWalkIn(Long cashierUserId, List<PosCartItemDto> items,
                                    BigDecimal amountTendered, PaymentMethod paymentMethod);

    PosCheckoutResult checkoutWalkIn(Long cashierUserId, Long customerId, List<PosCartItemDto> items,
                                    BigDecimal amountTendered, PaymentMethod paymentMethod);

    ThermalReceiptDto getReceipt(String orderNumber);

    PosShiftDto openShift(Long cashierId, BigDecimal openingFloat, String notes);

    PosShiftDto closeShift(Long cashierId, BigDecimal closingCash, String notes);

    PosShiftDto getCurrentShift(Long cashierId);

    PosProductScanDto scanProduct(String sku);

    List<PosProductScanDto> getAllProducts();

    List<PosSaleSummaryDto> getSalesHistory(Long cashierId, String period);

    List<PosShiftDto> getAllShifts();

    record CashierStaffDto(
            Long id,
            String fullName,
            String email,
            String role,
            String avatarColor,
            boolean hasPin,
            String avatarUrl
    ) {
        public CashierStaffDto(Long id, String fullName, String email, String role, String avatarColor, boolean hasPin) {
            this(id, fullName, email, role, avatarColor, hasPin, null);
        }
    }

    record PosSaleItemDto(
            String productName,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal
    ) {}

    record PosSaleSummaryDto(
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
            List<PosSaleItemDto> items
    ) {}

    record PosCartItemDto(Long productId, int quantity, String batchPreference) {
        public PosCartItemDto(Long productId, int quantity) {
            this(productId, quantity, null);
        }
    }

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
            BigDecimal subtotal,
            String batchPreference,
            String expiryDate,
            Boolean isClearance,
            String expiryStatus
    ) {
        public ReceiptItemDto(String productName, int quantity, BigDecimal unitPrice, BigDecimal subtotal) {
            this(productName, quantity, unitPrice, subtotal, null, null, false, null);
        }
    }

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

    record PosProductBatchDto(
            Long batchId,
            String batchCode,
            java.time.LocalDate expiryDate,
            int currentQuantity,
            boolean isNearExpiry,
            long daysUntilExpiry
    ) {}

    record PosProductScanDto(
            Long id,
            String sku,
            String name,
            String imageUrl,
            BigDecimal retailPrice,
            int availableStock,
            boolean isPerishable,
            String description,
            String categoryName,
            BigDecimal wholesalePrice,
            BigDecimal costPrice,
            Integer minStockThreshold,
            java.time.LocalDate currentBatchExpiryDate,
            String currentBatchCode,
            Integer nearExpiryQuantity,
            BigDecimal clearancePrice,
            Integer freshStockQuantity,
            java.time.LocalDate freshBatchExpiryDate,
            String freshBatchCode,
            List<PosProductBatchDto> batches
    ) {
        public PosProductScanDto(
                Long id,
                String sku,
                String name,
                String imageUrl,
                BigDecimal retailPrice,
                int availableStock,
                boolean isPerishable,
                String description,
                String categoryName,
                BigDecimal wholesalePrice,
                BigDecimal costPrice,
                Integer minStockThreshold,
                java.time.LocalDate currentBatchExpiryDate,
                String currentBatchCode
        ) {
            this(id, sku, name, imageUrl, retailPrice, availableStock, isPerishable, description, categoryName,
                 wholesalePrice, costPrice, minStockThreshold, currentBatchExpiryDate, currentBatchCode,
                 0, null, availableStock, null, null, List.of());
        }

        public PosProductScanDto(
                Long id,
                String sku,
                String name,
                String imageUrl,
                BigDecimal retailPrice,
                int availableStock,
                boolean isPerishable
        ) {
            this(id, sku, name, imageUrl, retailPrice, availableStock, isPerishable, null, null, null, null, null, null, null);
        }
    }
}

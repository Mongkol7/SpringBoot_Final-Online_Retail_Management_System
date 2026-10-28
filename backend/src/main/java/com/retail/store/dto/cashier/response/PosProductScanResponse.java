package com.retail.store.dto.cashier.response;

import com.retail.store.service.CashierService;

import java.math.BigDecimal;
import java.util.List;

public record PosProductScanResponse(
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
        List<CashierService.PosProductBatchDto> batches
) {
    public PosProductScanResponse(
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
        this(id, sku, name, imageUrl, retailPrice, availableStock, isPerishable, description, categoryName, wholesalePrice, costPrice, minStockThreshold, currentBatchExpiryDate, currentBatchCode, 0, null, availableStock, null, null, List.of());
    }

    public PosProductScanResponse(
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

    public static PosProductScanResponse from(CashierService.PosProductScanDto dto) {
        if (dto == null) return null;
        return new PosProductScanResponse(
                dto.id(),
                dto.sku(),
                dto.name(),
                dto.imageUrl(),
                dto.retailPrice(),
                dto.availableStock(),
                dto.isPerishable(),
                dto.description(),
                dto.categoryName(),
                dto.wholesalePrice(),
                dto.costPrice(),
                dto.minStockThreshold(),
                dto.currentBatchExpiryDate(),
                dto.currentBatchCode(),
                dto.nearExpiryQuantity(),
                dto.clearancePrice(),
                dto.freshStockQuantity(),
                dto.freshBatchExpiryDate(),
                dto.freshBatchCode(),
                dto.batches()
        );
    }
}

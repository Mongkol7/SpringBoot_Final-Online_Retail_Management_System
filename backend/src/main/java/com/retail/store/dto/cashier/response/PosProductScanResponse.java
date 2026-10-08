package com.retail.store.dto.cashier.response;

import com.retail.store.service.CashierService;

import java.math.BigDecimal;

public record PosProductScanResponse(
        Long id,
        String sku,
        String name,
        BigDecimal retailPrice,
        int availableStock,
        boolean isPerishable
) {
    public static PosProductScanResponse from(CashierService.PosProductScanDto dto) {
        if (dto == null) return null;
        return new PosProductScanResponse(
                dto.id(),
                dto.sku(),
                dto.name(),
                dto.retailPrice(),
                dto.availableStock(),
                dto.isPerishable()
        );
    }
}

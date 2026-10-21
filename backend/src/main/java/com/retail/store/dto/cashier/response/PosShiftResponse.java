package com.retail.store.dto.cashier.response;

import com.retail.store.entity.enums.PosShiftStatus;
import com.retail.store.service.CashierService;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PosShiftResponse(
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
) {
    public static PosShiftResponse from(CashierService.PosShiftDto dto) {
        if (dto == null) return null;
        return new PosShiftResponse(
                dto.id(),
                dto.cashierId(),
                dto.cashierName(),
                dto.openedAt(),
                dto.closedAt(),
                dto.openingFloat(),
                dto.closingCash(),
                dto.systemCashTotal(),
                dto.cashVariance(),
                dto.totalTransactions(),
                dto.status(),
                dto.notes()
        );
    }
}

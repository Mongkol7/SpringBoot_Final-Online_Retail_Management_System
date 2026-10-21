package com.retail.store.dto.cashier.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record OpenShiftRequest(
        Long cashierId,
        @NotNull(message = "Opening float is required")
        @PositiveOrZero(message = "Opening float cannot be negative")
        BigDecimal openingFloat,
        String notes
) {}

package com.retail.store.dto.cashier.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CloseShiftRequest(
        Long cashierId,
        @NotNull(message = "Closing cash is required")
        @PositiveOrZero(message = "Closing cash cannot be negative")
        BigDecimal closingCash,
        String notes
) {}

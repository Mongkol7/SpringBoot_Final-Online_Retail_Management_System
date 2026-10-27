package com.retail.store.dto.cashier.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CashierPinLoginRequest(
        @NotNull(message = "Cashier staff ID is required")
        Long cashierId,

        @NotBlank(message = "PIN is required")
        String pin
) {}

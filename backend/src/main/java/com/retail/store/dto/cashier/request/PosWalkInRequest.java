package com.retail.store.dto.cashier.request;

import com.retail.store.entity.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

public record PosWalkInRequest(
        Long cashierId,
        Long customerId,
        @NotEmpty(message = "Cart items cannot be empty")
        List<@Valid PosCartItemRequest> items,
        @NotNull(message = "Amount tendered is required")
        @PositiveOrZero(message = "Amount tendered cannot be negative")
        BigDecimal amountTendered,
        PaymentMethod paymentMethod
) {}

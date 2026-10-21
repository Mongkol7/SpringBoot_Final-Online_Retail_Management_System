package com.retail.store.dto.cashier.response;

import com.retail.store.entity.Order;
import com.retail.store.service.CashierService;

import java.math.BigDecimal;

public record PosCheckoutResponse(
        PosOrderResponse order,
        BigDecimal amountTendered,
        BigDecimal changeDue
) {
    public static PosCheckoutResponse from(Order order, BigDecimal amountTendered, BigDecimal changeDue) {
        return new PosCheckoutResponse(
                PosOrderResponse.from(order),
                amountTendered,
                changeDue
        );
    }

    public static PosCheckoutResponse from(CashierService.PosCheckoutResult result) {
        if (result == null) return null;
        return from(result.order(), result.amountTendered(), result.changeDue());
    }
}

package com.retail.store.dto.cashier.response;

import com.retail.store.entity.enums.CustomerType;
import com.retail.store.service.AuthService;

public record CashierLoginResponse(
        String token,
        Long userId,
        String email,
        String fullName,
        String role,
        CustomerType customerType
) {
    public static CashierLoginResponse from(AuthService.AuthResponse auth) {
        if (auth == null) return null;
        return new CashierLoginResponse(
                auth.token(),
                auth.userId(),
                auth.email(),
                auth.fullName(),
                auth.role(),
                auth.customerType()
        );
    }
}

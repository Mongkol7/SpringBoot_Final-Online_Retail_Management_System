package com.retail.store.dto.cashier.response;

public record CashierStaffResponse(
        Long id,
        String fullName,
        String email,
        String role,
        String avatarColor,
        boolean hasPin,
        String avatarUrl
) {
    public CashierStaffResponse(Long id, String fullName, String email, String role, String avatarColor, boolean hasPin) {
        this(id, fullName, email, role, avatarColor, hasPin, null);
    }
}

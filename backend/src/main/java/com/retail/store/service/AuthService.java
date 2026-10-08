package com.retail.store.service;

import com.retail.store.entity.User;
import com.retail.store.entity.enums.CustomerType;

public interface AuthService {
    User register(String email, String password, String fullName, String phone);
    AuthResponse login(String email, String password);

    record AuthResponse(
            String token,
            Long userId,
            String email,
            String fullName,
            String role,
            CustomerType customerType
    ) {}
}

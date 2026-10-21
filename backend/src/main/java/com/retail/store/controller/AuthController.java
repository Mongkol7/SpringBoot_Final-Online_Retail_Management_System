package com.retail.store.controller;

import com.retail.store.entity.User;
import com.retail.store.exception.BadRequestException;
import com.retail.store.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        if (request.email() == null || request.email().trim().isEmpty()) {
            throw new BadRequestException("Email address is required.");
        }
        if (request.password() == null || request.password().trim().isEmpty()) {
            throw new BadRequestException("Password is required.");
        }
        if (request.fullName() == null || request.fullName().trim().isEmpty()) {
            throw new BadRequestException("Full name is required.");
        }
        User user = authService.register(request.email().trim(), request.password(), request.fullName().trim(), request.phone());
        return new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.AuthResponse> login(@RequestBody LoginRequest request) {
        if (request.email() == null || request.email().trim().isEmpty()) {
            throw new BadRequestException("Email address is required.");
        }
        if (request.password() == null || request.password().trim().isEmpty()) {
            throw new BadRequestException("Password is required.");
        }
        AuthService.AuthResponse response = authService.login(request.email().trim(), request.password());
        return ResponseEntity.ok(response);
    }

    public record RegisterRequest(String email, String password, String fullName, String phone) {}
    public record LoginRequest(String email, String password) {}
}

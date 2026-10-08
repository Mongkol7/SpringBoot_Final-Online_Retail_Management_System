package com.retail.store.controller;

import com.retail.store.entity.User;
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
        User user = authService.register(request.email(), request.password(), request.fullName(), request.phone());
        return new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.AuthResponse> login(@RequestBody LoginRequest request) {
        AuthService.AuthResponse response = authService.login(request.email(), request.password());
        return ResponseEntity.ok(response);
    }

    public record RegisterRequest(String email, String password, String fullName, String phone) {}
    public record LoginRequest(String email, String password) {}
}

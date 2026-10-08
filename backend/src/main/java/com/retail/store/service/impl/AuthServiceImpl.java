package com.retail.store.service.impl;

import com.retail.store.entity.Role;
import com.retail.store.entity.User;
import com.retail.store.entity.enums.CustomerType;
import com.retail.store.exception.BadRequestException;
import com.retail.store.exception.ResourceNotFoundException;
import com.retail.store.repository.RoleRepository;
import com.retail.store.repository.UserRepository;
import com.retail.store.security.jwt.JwtTokenProvider;
import com.retail.store.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Override
    @Transactional
    public User register(String email, String password, String fullName, String phone) {
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with this email already exists: " + email);
        }

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new ResourceNotFoundException("Default role 'USER' not found in database"));

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .fullName(fullName)
                .phone(phone)
                .role(userRole)
                .customerType(CustomerType.RETAIL)
                .isActive(true)
                .build();

        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Your account has been deactivated. Please contact administrator.");
        }

        String token = tokenProvider.generateToken(
                user.getEmail(),
                user.getId(),
                user.getRole().getName(),
                user.getCustomerType().name()
        );

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().getName(),
                user.getCustomerType()
        );
    }
}

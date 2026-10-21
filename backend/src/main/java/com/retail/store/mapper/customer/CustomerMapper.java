package com.retail.store.mapper.customer;

import com.retail.store.dto.customer.request.CustomerRequest;
import com.retail.store.dto.customer.response.CustomerResponse;
import com.retail.store.entity.Role;
import com.retail.store.entity.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * =========================================================================
 * 👤 ASSIGNED TO: PERSON 1 (USER / Customer Role)
 * =========================================================================
 * Dedicated mapper bean responsible for converting Customer Domain Entities
 * (User, Role) and Service DTOs into enterprise HTTP API request/response objects.
 * =========================================================================
 */
@Component
public class CustomerMapper {

    /**
     * Converts a User entity into a CustomerResponse DTO.
     */
    public CustomerResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        return CustomerResponse.from(user);
    }

    /**
     * Converts a CustomerRequest DTO, associated Role, and encoded password
     * into a new User entity.
     */
    public User toEntity(CustomerRequest request, Role role, String encodedPassword) {
        if (request == null) {
            return null;
        }

        return User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(encodedPassword)
                .phone(request.getPhone())
                .role(role)
                .customerType(request.getCustomerType())
                .addresses(request.getAddresses())
                .isActive(true)
                .build();
    }

    /**
     * Converts a collection of User entities into CustomerResponse DTOs.
     */
    public List<CustomerResponse> toResponseList(List<User> users) {
        if (users == null || users.isEmpty()) {
            return Collections.emptyList();
        }
        return users.stream()
                .map(this::toResponse)
                .toList();
    }
}

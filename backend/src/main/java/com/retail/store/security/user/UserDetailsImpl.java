package com.retail.store.security.user;

import com.retail.store.entity.User;
import com.retail.store.entity.enums.CustomerType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final String fullName;
    private final String roleName;
    private final CustomerType customerType;
    private final boolean isActive;

    public UserDetailsImpl(Long id, String email, String password, String fullName,
                           String roleName, CustomerType customerType, boolean isActive) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.roleName = roleName;
        this.customerType = customerType;
        this.isActive = isActive;
    }

    public static UserDetailsImpl build(User user) {
        return new UserDetailsImpl(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getFullName(),
                user.getRole().getName(),
                user.getCustomerType(),
                user.getIsActive() != null ? user.getIsActive() : true
        );
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public String getRoleName() {
        return roleName;
    }

    public CustomerType getCustomerType() {
        return customerType;
    }

    public boolean isActive() {
        return isActive;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + roleName));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isActive;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }
}

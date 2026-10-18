package com.retail.store.dto.customer.request;

import com.retail.store.entity.enums.CustomerType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * =========================================================================
 * 👤 ASSIGNED TO: PERSON 1 (USER / Customer Role)
 * =========================================================================
 * Request DTO representing customer registration or account profile updates.
 * Directly mapped to com.retail.store.entity.User and Role entities.
 * =========================================================================
 */
public class CustomerRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 4, max = 255, message = "Password must be between 4 and 255 characters")
    private String password;

    private String phone;

    @NotNull(message = "Role ID is required")
    private Integer roleId;

    private CustomerType customerType = CustomerType.RETAIL;

    private String addresses;

    public CustomerRequest() {}

    public CustomerRequest(String fullName, String email, String password, String phone,
                           Integer roleId, CustomerType customerType, String addresses) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.roleId = roleId;
        this.customerType = customerType != null ? customerType : CustomerType.RETAIL;
        this.addresses = addresses;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }

    public CustomerType getCustomerType() {
        return customerType;
    }

    public void setCustomerType(CustomerType customerType) {
        this.customerType = customerType != null ? customerType : CustomerType.RETAIL;
    }

    public String getAddresses() {
        return addresses;
    }

    public void setAddresses(String addresses) {
        this.addresses = addresses;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String fullName;
        private String email;
        private String password;
        private String phone;
        private Integer roleId;
        private CustomerType customerType = CustomerType.RETAIL;
        private String addresses;

        public Builder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder password(String password) {
            this.password = password;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder roleId(Integer roleId) {
            this.roleId = roleId;
            return this;
        }

        public Builder customerType(CustomerType customerType) {
            this.customerType = customerType;
            return this;
        }

        public Builder addresses(String addresses) {
            this.addresses = addresses;
            return this;
        }

        public CustomerRequest build() {
            return new CustomerRequest(fullName, email, password, phone, roleId, customerType, addresses);
        }
    }

    @Override
    public String toString() {
        return "CustomerRequest{" +
                "fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                ", password='[PROTECTED]'" +
                ", phone='" + phone + '\'' +
                ", roleId=" + roleId +
                ", customerType=" + customerType +
                ", addresses='" + addresses + '\'' +
                '}';
    }
}

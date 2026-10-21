package com.retail.store.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "contact_name", length = 100)
    private String contactName;

    @Column(length = 150)
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(columnDefinition = "text")
    private String address;

    @Column(name = "profile_image", columnDefinition = "text")
    private String profileImage;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    public Supplier() {}

    public Supplier(Integer id, String name, String contactName, String email, String phone, String address) {
        this(id, name, contactName, email, phone, address, null, false);
    }

    public Supplier(Integer id, String name, String contactName, String email, String phone, String address, Boolean isDeleted) {
        this(id, name, contactName, email, phone, address, null, isDeleted);
    }

    public Supplier(Integer id, String name, String contactName, String email, String phone, String address, String profileImage, Boolean isDeleted) {
        this.id = id;
        this.name = name;
        this.contactName = contactName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.profileImage = profileImage;
        this.isDeleted = isDeleted != null ? isDeleted : false;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted != null ? isDeleted : false; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Integer id;
        private String name;
        private String contactName;
        private String email;
        private String phone;
        private String address;
        private String profileImage;
        private Boolean isDeleted = false;

        public Builder id(Integer id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder contactName(String contactName) { this.contactName = contactName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder profileImage(String profileImage) { this.profileImage = profileImage; return this; }
        public Builder isDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; return this; }

        public Supplier build() {
            return new Supplier(id, name, contactName, email, phone, address, profileImage, isDeleted);
        }
    }
}

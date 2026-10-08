package com.retail.store.entity;

import com.retail.store.entity.enums.ApplicationStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "wholesale_applications")
public class WholesaleApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "business_name", nullable = false, length = 150)
    private String businessName;

    @Column(name = "tax_id_or_license", nullable = false, length = 100)
    private String taxIdOrLicense;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "admin_notes", columnDefinition = "text")
    private String adminNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public WholesaleApplication() {}

    public WholesaleApplication(Long id, User user, String businessName, String taxIdOrLicense,
                                ApplicationStatus status, User reviewedBy, LocalDateTime reviewedAt,
                                String adminNotes, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.businessName = businessName;
        this.taxIdOrLicense = taxIdOrLicense;
        this.status = status != null ? status : ApplicationStatus.PENDING;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = reviewedAt;
        this.adminNotes = adminNotes;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getTaxIdOrLicense() { return taxIdOrLicense; }
    public void setTaxIdOrLicense(String taxIdOrLicense) { this.taxIdOrLicense = taxIdOrLicense; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private User user;
        private String businessName;
        private String taxIdOrLicense;
        private ApplicationStatus status = ApplicationStatus.PENDING;
        private User reviewedBy;
        private LocalDateTime reviewedAt;
        private String adminNotes;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder businessName(String businessName) { this.businessName = businessName; return this; }
        public Builder taxIdOrLicense(String taxIdOrLicense) { this.taxIdOrLicense = taxIdOrLicense; return this; }
        public Builder status(ApplicationStatus status) { this.status = status; return this; }
        public Builder reviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; return this; }
        public Builder reviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; return this; }
        public Builder adminNotes(String adminNotes) { this.adminNotes = adminNotes; return this; }

        public WholesaleApplication build() {
            return new WholesaleApplication(id, user, businessName, taxIdOrLicense, status, reviewedBy, reviewedAt, adminNotes, null);
        }
    }
}

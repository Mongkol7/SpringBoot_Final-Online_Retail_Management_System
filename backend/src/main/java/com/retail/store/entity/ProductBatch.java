package com.retail.store.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_batches")
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_code", nullable = false, unique = true, length = 100)
    private String batchCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "initial_quantity", nullable = false)
    private Integer initialQuantity;

    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "is_expired", nullable = false)
    private Boolean isExpired = false;

    @CreationTimestamp
    @Column(name = "received_at", updatable = false)
    private LocalDateTime receivedAt;

    public ProductBatch() {}

    public ProductBatch(Long id, String batchCode, Product product, Supplier supplier,
                        Integer initialQuantity, Integer currentQuantity, LocalDate expiryDate,
                        Boolean isExpired, LocalDateTime receivedAt) {
        this.id = id;
        this.batchCode = batchCode;
        this.product = product;
        this.supplier = supplier;
        this.initialQuantity = initialQuantity;
        this.currentQuantity = currentQuantity;
        this.expiryDate = expiryDate;
        this.isExpired = isExpired != null ? isExpired : false;
        this.receivedAt = receivedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBatchCode() { return batchCode; }
    public void setBatchCode(String batchCode) { this.batchCode = batchCode; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }

    public Integer getInitialQuantity() { return initialQuantity; }
    public void setInitialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; }

    public Integer getCurrentQuantity() { return currentQuantity; }
    public void setCurrentQuantity(Integer currentQuantity) { this.currentQuantity = currentQuantity; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Boolean getIsExpired() { return isExpired; }
    public void setIsExpired(Boolean expired) { isExpired = expired; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String batchCode;
        private Product product;
        private Supplier supplier;
        private Integer initialQuantity;
        private Integer currentQuantity;
        private LocalDate expiryDate;
        private Boolean isExpired = false;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder batchCode(String batchCode) { this.batchCode = batchCode; return this; }
        public Builder product(Product product) { this.product = product; return this; }
        public Builder supplier(Supplier supplier) { this.supplier = supplier; return this; }
        public Builder initialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; return this; }
        public Builder currentQuantity(Integer currentQuantity) { this.currentQuantity = currentQuantity; return this; }
        public Builder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public Builder isExpired(Boolean isExpired) { this.isExpired = isExpired; return this; }

        public ProductBatch build() {
            return new ProductBatch(id, batchCode, product, supplier, initialQuantity, currentQuantity, expiryDate, isExpired, null);
        }
    }
}

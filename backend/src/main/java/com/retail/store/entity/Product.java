package com.retail.store.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, unique = true, length = 80)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "cost_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal costPrice;

    @Column(name = "retail_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal retailPrice;

    @Column(name = "wholesale_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal wholesalePrice;

    @Column(name = "min_stock_threshold", nullable = false)
    private Integer minStockThreshold = 10;

    @Column(name = "is_perishable", nullable = false)
    private Boolean isPerishable = false;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Product() {}

    public Product(Long id, Category category, String sku, String name, String description,
                   String imageUrl, BigDecimal costPrice, BigDecimal retailPrice,
                   BigDecimal wholesalePrice, Integer minStockThreshold, Boolean isPerishable,
                   Boolean isDeleted, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.category = category;
        this.sku = sku;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.costPrice = costPrice;
        this.retailPrice = retailPrice;
        this.wholesalePrice = wholesalePrice;
        this.minStockThreshold = minStockThreshold != null ? minStockThreshold : 10;
        this.isPerishable = isPerishable != null ? isPerishable : false;
        this.isDeleted = isDeleted != null ? isDeleted : false;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public BigDecimal getCostPrice() { return costPrice; }
    public void setCostPrice(BigDecimal costPrice) { this.costPrice = costPrice; }

    public BigDecimal getRetailPrice() { return retailPrice; }
    public void setRetailPrice(BigDecimal retailPrice) { this.retailPrice = retailPrice; }

    public BigDecimal getWholesalePrice() { return wholesalePrice; }
    public void setWholesalePrice(BigDecimal wholesalePrice) { this.wholesalePrice = wholesalePrice; }

    public Integer getMinStockThreshold() { return minStockThreshold; }
    public void setMinStockThreshold(Integer minStockThreshold) { this.minStockThreshold = minStockThreshold; }

    public Boolean getIsPerishable() { return isPerishable; }
    public void setIsPerishable(Boolean perishable) { isPerishable = perishable; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean deleted) { isDeleted = deleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Category category;
        private String sku;
        private String name;
        private String description;
        private String imageUrl;
        private BigDecimal costPrice;
        private BigDecimal retailPrice;
        private BigDecimal wholesalePrice;
        private Integer minStockThreshold = 10;
        private Boolean isPerishable = false;
        private Boolean isDeleted = false;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder category(Category category) { this.category = category; return this; }
        public Builder sku(String sku) { this.sku = sku; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }
        public Builder costPrice(BigDecimal costPrice) { this.costPrice = costPrice; return this; }
        public Builder retailPrice(BigDecimal retailPrice) { this.retailPrice = retailPrice; return this; }
        public Builder wholesalePrice(BigDecimal wholesalePrice) { this.wholesalePrice = wholesalePrice; return this; }
        public Builder minStockThreshold(Integer minStockThreshold) { this.minStockThreshold = minStockThreshold; return this; }
        public Builder isPerishable(Boolean isPerishable) { this.isPerishable = isPerishable; return this; }
        public Builder isDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; return this; }

        public Product build() {
            return new Product(id, category, sku, name, description, imageUrl, costPrice, retailPrice, wholesalePrice, minStockThreshold, isPerishable, isDeleted, null, null);
        }
    }
}

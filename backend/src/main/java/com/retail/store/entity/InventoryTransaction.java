package com.retail.store.entity;

import com.retail.store.entity.enums.TransactionType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TransactionType type;

    @Column(name = "quantity_delta", nullable = false)
    private Integer quantityDelta;

    @Column(columnDefinition = "text")
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public InventoryTransaction() {}

    public InventoryTransaction(Long id, ProductBatch batch, User user, TransactionType type,
                                Integer quantityDelta, String reason, LocalDateTime createdAt) {
        this.id = id;
        this.batch = batch;
        this.user = user;
        this.type = type;
        this.quantityDelta = quantityDelta;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ProductBatch getBatch() { return batch; }
    public void setBatch(ProductBatch batch) { this.batch = batch; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public Integer getQuantityDelta() { return quantityDelta; }
    public void setQuantityDelta(Integer quantityDelta) { this.quantityDelta = quantityDelta; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private ProductBatch batch;
        private User user;
        private TransactionType type;
        private Integer quantityDelta;
        private String reason;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder batch(ProductBatch batch) { this.batch = batch; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder type(TransactionType type) { this.type = type; return this; }
        public Builder quantityDelta(Integer quantityDelta) { this.quantityDelta = quantityDelta; return this; }
        public Builder reason(String reason) { this.reason = reason; return this; }

        public InventoryTransaction build() {
            return new InventoryTransaction(id, batch, user, type, quantityDelta, reason, null);
        }
    }
}

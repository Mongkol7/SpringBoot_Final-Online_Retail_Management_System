package com.retail.store.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "order_item_batch_fulfillments")
public class OrderItemBatchFulfillment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private ProductBatch batch;

    @Column(name = "quantity_deducted", nullable = false)
    private Integer quantityDeducted;

    public OrderItemBatchFulfillment() {}

    public OrderItemBatchFulfillment(Long id, OrderItem orderItem, ProductBatch batch, Integer quantityDeducted) {
        this.id = id;
        this.orderItem = orderItem;
        this.batch = batch;
        this.quantityDeducted = quantityDeducted;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public OrderItem getOrderItem() { return orderItem; }
    public void setOrderItem(OrderItem orderItem) { this.orderItem = orderItem; }

    public ProductBatch getBatch() { return batch; }
    public void setBatch(ProductBatch batch) { this.batch = batch; }

    public Integer getQuantityDeducted() { return quantityDeducted; }
    public void setQuantityDeducted(Integer quantityDeducted) { this.quantityDeducted = quantityDeducted; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private OrderItem orderItem;
        private ProductBatch batch;
        private Integer quantityDeducted;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder orderItem(OrderItem orderItem) { this.orderItem = orderItem; return this; }
        public Builder batch(ProductBatch batch) { this.batch = batch; return this; }
        public Builder quantityDeducted(Integer quantityDeducted) { this.quantityDeducted = quantityDeducted; return this; }

        public OrderItemBatchFulfillment build() {
            return new OrderItemBatchFulfillment(id, orderItem, batch, quantityDeducted);
        }
    }
}

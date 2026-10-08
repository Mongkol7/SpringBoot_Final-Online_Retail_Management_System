package com.retail.store.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemBatchFulfillment> batchFulfillments = new ArrayList<>();

    public OrderItem() {}

    public OrderItem(Long id, Order order, Product product, Integer quantity,
                     BigDecimal unitPrice, BigDecimal subtotal,
                     List<OrderItemBatchFulfillment> batchFulfillments) {
        this.id = id;
        this.order = order;
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
        this.batchFulfillments = batchFulfillments != null ? batchFulfillments : new ArrayList<>();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public List<OrderItemBatchFulfillment> getBatchFulfillments() { return batchFulfillments; }
    public void setBatchFulfillments(List<OrderItemBatchFulfillment> batchFulfillments) { this.batchFulfillments = batchFulfillments; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Order order;
        private Product product;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private List<OrderItemBatchFulfillment> batchFulfillments = new ArrayList<>();

        public Builder id(Long id) { this.id = id; return this; }
        public Builder order(Order order) { this.order = order; return this; }
        public Builder product(Product product) { this.product = product; return this; }
        public Builder quantity(Integer quantity) { this.quantity = quantity; return this; }
        public Builder unitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; return this; }
        public Builder subtotal(BigDecimal subtotal) { this.subtotal = subtotal; return this; }
        public Builder batchFulfillments(List<OrderItemBatchFulfillment> batchFulfillments) { this.batchFulfillments = batchFulfillments; return this; }

        public OrderItem build() {
            return new OrderItem(id, order, product, quantity, unitPrice, subtotal, batchFulfillments);
        }
    }
}

package com.retail.store.entity;

import com.retail.store.entity.enums.PosShiftStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pos_shifts")
public class PosShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cashier_id", nullable = false)
    private User cashier;

    @CreationTimestamp
    @Column(name = "opened_at", nullable = false, updatable = false)
    private LocalDateTime openedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "opening_float", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingFloat = BigDecimal.ZERO;

    @Column(name = "closing_cash", precision = 12, scale = 2)
    private BigDecimal closingCash;

    @Column(name = "system_cash_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal systemCashTotal = BigDecimal.ZERO;

    @Column(name = "cash_variance", precision = 12, scale = 2)
    private BigDecimal cashVariance;

    @Column(name = "total_transactions", nullable = false)
    private Integer totalTransactions = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PosShiftStatus status = PosShiftStatus.OPEN;

    @Column(columnDefinition = "text")
    private String notes;

    public PosShift() {}

    public PosShift(Long id, User cashier, LocalDateTime openedAt, LocalDateTime closedAt,
                    BigDecimal openingFloat, BigDecimal closingCash, BigDecimal systemCashTotal,
                    BigDecimal cashVariance, Integer totalTransactions, PosShiftStatus status,
                    String notes) {
        this.id = id;
        this.cashier = cashier;
        this.openedAt = openedAt;
        this.closedAt = closedAt;
        this.openingFloat = openingFloat != null ? openingFloat : BigDecimal.ZERO;
        this.closingCash = closingCash;
        this.systemCashTotal = systemCashTotal != null ? systemCashTotal : BigDecimal.ZERO;
        this.cashVariance = cashVariance;
        this.totalTransactions = totalTransactions != null ? totalTransactions : 0;
        this.status = status != null ? status : PosShiftStatus.OPEN;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getCashier() { return cashier; }
    public void setCashier(User cashier) { this.cashier = cashier; }

    public LocalDateTime getOpenedAt() { return openedAt; }
    public void setOpenedAt(LocalDateTime openedAt) { this.openedAt = openedAt; }

    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }

    public BigDecimal getOpeningFloat() { return openingFloat; }
    public void setOpeningFloat(BigDecimal openingFloat) { this.openingFloat = openingFloat; }

    public BigDecimal getClosingCash() { return closingCash; }
    public void setClosingCash(BigDecimal closingCash) { this.closingCash = closingCash; }

    public BigDecimal getSystemCashTotal() { return systemCashTotal; }
    public void setSystemCashTotal(BigDecimal systemCashTotal) { this.systemCashTotal = systemCashTotal; }

    public BigDecimal getCashVariance() { return cashVariance; }
    public void setCashVariance(BigDecimal cashVariance) { this.cashVariance = cashVariance; }

    public Integer getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(Integer totalTransactions) { this.totalTransactions = totalTransactions; }

    public PosShiftStatus getStatus() { return status; }
    public void setStatus(PosShiftStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private User cashier;
        private LocalDateTime openedAt;
        private LocalDateTime closedAt;
        private BigDecimal openingFloat = BigDecimal.ZERO;
        private BigDecimal closingCash;
        private BigDecimal systemCashTotal = BigDecimal.ZERO;
        private BigDecimal cashVariance;
        private Integer totalTransactions = 0;
        private PosShiftStatus status = PosShiftStatus.OPEN;
        private String notes;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder cashier(User cashier) { this.cashier = cashier; return this; }
        public Builder openedAt(LocalDateTime openedAt) { this.openedAt = openedAt; return this; }
        public Builder closedAt(LocalDateTime closedAt) { this.closedAt = closedAt; return this; }
        public Builder openingFloat(BigDecimal openingFloat) { this.openingFloat = openingFloat; return this; }
        public Builder closingCash(BigDecimal closingCash) { this.closingCash = closingCash; return this; }
        public Builder systemCashTotal(BigDecimal systemCashTotal) { this.systemCashTotal = systemCashTotal; return this; }
        public Builder cashVariance(BigDecimal cashVariance) { this.cashVariance = cashVariance; return this; }
        public Builder totalTransactions(Integer totalTransactions) { this.totalTransactions = totalTransactions; return this; }
        public Builder status(PosShiftStatus status) { this.status = status; return this; }
        public Builder notes(String notes) { this.notes = notes; return this; }

        public PosShift build() {
            return new PosShift(id, cashier, openedAt, closedAt, openingFloat, closingCash, systemCashTotal, cashVariance, totalTransactions, status, notes);
        }
    }
}

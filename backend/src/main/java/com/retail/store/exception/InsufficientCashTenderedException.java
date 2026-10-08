package com.retail.store.exception;

import java.math.BigDecimal;

public class InsufficientCashTenderedException extends RuntimeException {

    private final BigDecimal totalAmount;
    private final BigDecimal amountTendered;

    public InsufficientCashTenderedException(BigDecimal totalAmount, BigDecimal amountTendered) {
        super(String.format("Insufficient cash tendered: Grand total is $%.2f but received $%.2f",
                totalAmount, amountTendered));
        this.totalAmount = totalAmount;
        this.amountTendered = amountTendered;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BigDecimal getAmountTendered() {
        return amountTendered;
    }
}

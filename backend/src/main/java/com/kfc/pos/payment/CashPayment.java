package com.kfc.pos.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class CashPayment extends Payment {
    private final BigDecimal amountTendered;

    public CashPayment(BigDecimal amountDue, BigDecimal amountTendered) {
        super(amountDue);
        this.amountTendered = amountTendered == null
                ? null
                : amountTendered.setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public String getMethod() { return "CASH"; }

    @Override
    protected void validate() {
        if (amountTendered == null) {
            throw new IllegalArgumentException("Enter the cash amount received");
        }
        if (amountTendered.compareTo(getAmountDue()) < 0) {
            throw new IllegalArgumentException("Cash received is less than the total ("
                    + getAmountDue().toPlainString() + ")");
        }
    }

    @Override
    protected String buildReference() {
        return "CASH-" + System.currentTimeMillis();
    }

    @Override
    public String getDetails() { return "Cash"; }

    @Override
    public BigDecimal getAmountTendered() { return amountTendered; }
}

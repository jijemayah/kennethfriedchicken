package com.kfc.pos.payment;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * A payment that was already saved, read back from the database for
 * order history and receipts. It is read-only: no setters at all.
 * (A live Payment subclass is only needed while checking out.)
 */
public class PaymentRecord {

    private final String method;
    private final BigDecimal amountDue;
    private final BigDecimal amountTendered;
    private final BigDecimal change;
    private final String referenceNumber;
    private final String details;
    private final OffsetDateTime paidAt;

    public PaymentRecord(String method, BigDecimal amountDue, BigDecimal amountTendered, BigDecimal change,
                         String referenceNumber, String details, OffsetDateTime paidAt) {
        this.method = method;
        this.amountDue = amountDue;
        this.amountTendered = amountTendered;
        this.change = change;
        this.referenceNumber = referenceNumber;
        this.details = details;
        this.paidAt = paidAt;
    }

    public String getMethod() { return method; }

    public BigDecimal getAmountDue() { return amountDue; }

    public BigDecimal getAmountTendered() { return amountTendered; }

    public BigDecimal getChange() { return change; }

    public String getReferenceNumber() { return referenceNumber; }

    public String getDetails() { return details; }

    public OffsetDateTime getPaidAt() { return paidAt; }
}

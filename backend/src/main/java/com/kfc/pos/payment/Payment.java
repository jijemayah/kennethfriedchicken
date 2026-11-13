package com.kfc.pos.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.concurrent.ThreadLocalRandom;

public abstract class Payment {
    private final BigDecimal amountDue;
    private String referenceNumber;
    private boolean paid;

    protected Payment(BigDecimal amountDue) {
        if (amountDue == null || amountDue.signum() <= 0) {
            throw new IllegalArgumentException("Amount due must be more than zero");
        }
        this.amountDue = amountDue.setScale(2, RoundingMode.HALF_UP);
    }

    public abstract String getMethod();

    protected abstract void validate();

    protected abstract String buildReference();

    public abstract String getDetails();

    public final void process() {
        if (paid) {
            throw new IllegalStateException("Payment was already processed");
        }
        validate();
        referenceNumber = buildReference();
        paid = true;
    }

    public BigDecimal getAmountTendered() {
        return amountDue;
    }

    public BigDecimal getChange() {
        return getAmountTendered().subtract(amountDue);
    }

    public BigDecimal getAmountDue() { return amountDue; }

    public String getReferenceNumber() { return referenceNumber; }

    public boolean isPaid() { return paid; }

    protected static String randomDigits(int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(ThreadLocalRandom.current().nextInt(10));
        }
        return sb.toString();
    }

    public static Payment create(String method, BigDecimal amountDue, BigDecimal amountTendered,
                                 String mobileNumber, String cardNumber, String cardHolder) {
        String value = method == null ? "" : method.trim().toUpperCase();
        return switch (value) {
            case "CASH" -> new CashPayment(amountDue, amountTendered);
            case "GCASH" -> new GCashPayment(amountDue, mobileNumber);
            case "CARD" -> new CardPayment(amountDue, cardNumber, cardHolder);
            default -> throw new IllegalArgumentException("Payment method must be CASH, GCASH, or CARD");
        };
    }
}

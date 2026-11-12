package com.kfc.pos.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.concurrent.ThreadLocalRandom;

/**
 * ABSTRACTION: this abstract class describes WHAT every payment does
 * (validate, process, produce a reference number) without saying HOW.
 *
 * The checkout code only ever talks to "Payment". It calls process()
 * and never needs to know whether the customer paid by cash, GCash, or card.
 * Each subclass hides its own rules (cash needs change, GCash needs a
 * mobile number, card needs a valid card number).
 *
 * POLYMORPHISM: process() calls validate(), getMethod(), and buildReference(),
 * and Java runs the version from the actual subclass at runtime.
 */
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

    // ---- Abstract methods: every payment type MUST implement these ----

    /** "CASH", "GCASH", or "CARD". */
    public abstract String getMethod();

    /** Throws IllegalArgumentException if this payment cannot be accepted. */
    protected abstract void validate();

    /** Each provider formats its reference number differently. */
    protected abstract String buildReference();

    /** Safe text for the receipt, e.g. "GCash 0917****567". Never the full card number. */
    public abstract String getDetails();

    // ---- Shared behaviour ----

    /**
     * Same steps for every payment type. The simulated "gateway" is just
     * validation + a generated reference number.
     */
    public final void process() {
        if (paid) {
            throw new IllegalStateException("Payment was already processed");
        }
        validate();
        referenceNumber = buildReference();
        paid = true;
    }

    /** Cash overrides this; GCash and card always pay the exact amount. */
    public BigDecimal getAmountTendered() {
        return amountDue;
    }

    public BigDecimal getChange() {
        return getAmountTendered().subtract(amountDue);
    }

    public BigDecimal getAmountDue() { return amountDue; }

    public String getReferenceNumber() { return referenceNumber; }

    public boolean isPaid() { return paid; }

    /** Helper for subclasses: a random string of digits. */
    protected static String randomDigits(int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(ThreadLocalRandom.current().nextInt(10));
        }
        return sb.toString();
    }

    /**
     * Turns the method name sent by the frontend into the right subclass.
     * After this line the caller only sees the parent type "Payment".
     */
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

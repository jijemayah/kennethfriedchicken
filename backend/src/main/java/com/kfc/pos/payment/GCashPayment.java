package com.kfc.pos.payment;

import java.math.BigDecimal;
import java.util.regex.Pattern;

public class GCashPayment extends Payment {
    private static final Pattern MOBILE = Pattern.compile("^09\\d{9}$");

    private final String mobileNumber;

    public GCashPayment(BigDecimal amountDue, String mobileNumber) {
        super(amountDue);
        this.mobileNumber = mobileNumber == null ? "" : mobileNumber.replaceAll("[\\s-]", "");
    }

    @Override
    public String getMethod() { return "GCASH"; }

    @Override
    protected void validate() {
        if (!MOBILE.matcher(mobileNumber).matches()) {
            throw new IllegalArgumentException("GCash number must be 11 digits starting with 09");
        }
    }

    @Override
    protected String buildReference() {
        return randomDigits(13);
    }

    @Override
    public String getDetails() {
        return "GCash " + mobileNumber.replaceAll("^(\\d{4})\\d{4}(\\d{3})$", "$1****$2");
    }
}

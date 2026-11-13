package com.kfc.pos.payment;

import java.math.BigDecimal;
import java.util.regex.Pattern;

public class CardPayment extends Payment {
    private static final Pattern CARD_NUMBER = Pattern.compile("^\\d{16}$");
    private static final Pattern CARD_HOLDER = Pattern.compile("^[A-Za-z][A-Za-z .'-]{1,59}$");

    private final String cardNumber;
    private final String cardHolder;

    public CardPayment(BigDecimal amountDue, String cardNumber, String cardHolder) {
        super(amountDue);
        this.cardNumber = cardNumber == null ? "" : cardNumber.replaceAll("[\\s-]", "");
        this.cardHolder = cardHolder == null ? "" : cardHolder.trim();
    }

    @Override
    public String getMethod() { return "CARD"; }

    @Override
    protected void validate() {
        if (!CARD_NUMBER.matcher(cardNumber).matches()) {
            throw new IllegalArgumentException("Card number must be 16 digits");
        }
        if (!passesLuhnCheck(cardNumber)) {
            throw new IllegalArgumentException("Card number is not valid");
        }
        if (!CARD_HOLDER.matcher(cardHolder).matches()) {
            throw new IllegalArgumentException("Enter the card holder's name");
        }
    }

    @Override
    protected String buildReference() {
        return "AUTH-" + randomDigits(6);
    }

    @Override
    public String getDetails() {
        return getBrand() + " **** " + cardNumber.substring(cardNumber.length() - 4);
    }

    public String getBrand() {
        if (cardNumber.matches("^4\\d*")) {
            return "Visa";
        }
        if (cardNumber.matches("^(5[1-5]|2[2-7])\\d*")) {
            return "Mastercard";
        }
        return "Card";
    }

    private static boolean passesLuhnCheck(String digits) {
        int sum = 0;
        boolean doubleIt = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int n = digits.charAt(i) - '0';
            if (doubleIt) {
                n *= 2;
                if (n > 9) {
                    n -= 9;
                }
            }
            sum += n;
            doubleIt = !doubleIt;
        }
        return sum % 10 == 0;
    }
}

package com.kfc.pos.discount;

import com.kfc.pos.model.OrderItem;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Abstraction + polymorphism: Order calls {@link #apply(List)} and {@link #isVatExempt()} without knowing
 * which discount it has. Each subclass decides how much comes off each item.
 */
public abstract class Discount {
    private static final Pattern ID_NUMBER = Pattern.compile("^[A-Za-z0-9-]{4,30}$");

    private final String idNumber;

    protected Discount(String idNumber) {
        this.idNumber = idNumber;
    }

    public abstract String getType();

    public abstract String getLabel();

    /** Returns the discount for each item, in the same order as {@code items}. */
    protected abstract List<BigDecimal> calculate(List<OrderItem> items);

    public boolean isVatExempt() {
        return false;
    }

    public final void apply(List<OrderItem> items) {
        List<BigDecimal> amounts = calculate(items);
        for (int i = 0; i < items.size(); i++) {
            items.get(i).applyDiscount(amounts.get(i), isVatExempt());
        }
    }

    public String getIdNumber() { return idNumber; }

    protected static BigDecimal percent(BigDecimal amount, String rate) {
        return amount.multiply(new BigDecimal(rate)).setScale(2, RoundingMode.HALF_UP);
    }

    protected static String requireIdNumber(String value, String label) {
        String id = value == null ? "" : value.trim().toUpperCase();
        if (!ID_NUMBER.matcher(id).matches()) {
            throw new IllegalArgumentException(label + " must be 4-30 letters, numbers or dashes");
        }
        return id;
    }

    public static Discount create(String type, String idNumber) {
        String value = type == null || type.isBlank() ? "NONE" : type.trim().toUpperCase();
        return switch (value) {
            case "NONE" -> new NoDiscount();
            case "SENIOR", "PWD" -> new SeniorPwdDiscount(value, idNumber);
            case "EMPLOYEE" -> new EmployeeDiscount(idNumber);
            default -> throw new IllegalArgumentException("Discount must be NONE, SENIOR, PWD or EMPLOYEE");
        };
    }
}

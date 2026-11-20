package com.kfc.pos.discount;

import com.kfc.pos.model.OrderItem;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Senior citizen / PWD: no VAT, 20% off the whole order, at most ₱250 in total. */
public class SeniorPwdDiscount extends Discount {
    public static final BigDecimal CAP = new BigDecimal("250.00");

    private final String type;

    public SeniorPwdDiscount(String type, String idNumber) {
        super(requireIdNumber(idNumber, "SENIOR".equals(type) ? "Senior citizen ID" : "PWD ID"));
        if (!"SENIOR".equals(type) && !"PWD".equals(type)) {
            throw new IllegalArgumentException("Type must be SENIOR or PWD");
        }
        this.type = type;
    }

    @Override
    public String getType() { return type; }

    @Override
    public String getLabel() { return "SENIOR".equals(type) ? "Senior citizen (20%)" : "PWD (20%)"; }

    @Override
    public boolean isVatExempt() { return true; }

    @Override
    protected List<BigDecimal> calculate(List<OrderItem> items) {
        List<BigDecimal> amounts = new ArrayList<>();
        BigDecimal remaining = CAP;
        for (OrderItem item : items) {
            BigDecimal amount = percent(item.getLineTotal(), "0.20").min(remaining);
            amounts.add(amount);
            remaining = remaining.subtract(amount);
        }
        return amounts;
    }
}

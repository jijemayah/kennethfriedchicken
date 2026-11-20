package com.kfc.pos.discount;

import com.kfc.pos.model.OrderItem;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class NoDiscount extends Discount {
    public NoDiscount() {
        super(null);
    }

    @Override
    public String getType() { return "NONE"; }

    @Override
    public String getLabel() { return "No discount"; }

    @Override
    protected List<BigDecimal> calculate(List<OrderItem> items) {
        List<BigDecimal> amounts = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            amounts.add(BigDecimal.ZERO.setScale(2));
        }
        return amounts;
    }
}

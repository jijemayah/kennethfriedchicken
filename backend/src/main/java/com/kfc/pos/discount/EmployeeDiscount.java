package com.kfc.pos.discount;

import com.kfc.pos.model.OrderItem;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/** Employee: 10% off one unit of the most expensive item. VAT is still charged on what is left. */
public class EmployeeDiscount extends Discount {
    public static final Pattern EMPLOYEE_NO = Pattern.compile("^EMP-\\d{3,}$");

    public EmployeeDiscount(String employeeNo) {
        super(normalize(employeeNo));
    }

    private static String normalize(String value) {
        String no = value == null ? "" : value.trim().toUpperCase();
        if (!EMPLOYEE_NO.matcher(no).matches()) {
            throw new IllegalArgumentException("Employee number must look like EMP-001");
        }
        return no;
    }

    @Override
    public String getType() { return "EMPLOYEE"; }

    @Override
    public String getLabel() { return "Employee (10%)"; }

    @Override
    protected List<BigDecimal> calculate(List<OrderItem> items) {
        int priciest = -1;
        for (int i = 0; i < items.size(); i++) {
            if (priciest < 0 || items.get(i).getUnitPrice().compareTo(items.get(priciest).getUnitPrice()) > 0) {
                priciest = i;
            }
        }
        List<BigDecimal> amounts = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            amounts.add(i == priciest
                    ? percent(items.get(i).getUnitPrice(), "0.10")
                    : BigDecimal.ZERO.setScale(2));
        }
        return amounts;
    }
}

package com.kfc.pos.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class OrderItem {
    private final int productId;
    private final String productName;
    private final BigDecimal unitPrice;
    private int quantity;
    private BigDecimal discount = BigDecimal.ZERO.setScale(2);
    private BigDecimal vat = BigDecimal.ZERO.setScale(2);

    public OrderItem(int productId, String productName, BigDecimal unitPrice, int quantity) {
        this.productId = productId;
        this.productName = productName;
        this.unitPrice = Validator.requireMoney(unitPrice, "Unit price");
        setQuantity(quantity);
        applyDiscount(BigDecimal.ZERO, false);
    }

    /** Used when loading a saved order: discount and VAT are the values that were charged. */
    public OrderItem(int productId, String productName, BigDecimal unitPrice, int quantity,
                     BigDecimal discount, BigDecimal vat) {
        this(productId, productName, unitPrice, quantity);
        this.discount = Validator.requireMoney(discount, "Discount");
        this.vat = Validator.requireMoney(vat, "VAT");
    }

    public BigDecimal getLineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
    }

    /** VAT is computed per item, on the price after this item's discount. */
    public void applyDiscount(BigDecimal amount, boolean vatExempt) {
        BigDecimal value = Validator.requireMoney(amount, "Discount");
        if (value.compareTo(getLineTotal()) > 0) {
            throw new IllegalArgumentException("Discount cannot be more than the item price");
        }
        discount = value;
        vat = vatExempt
                ? BigDecimal.ZERO.setScale(2)
                : getLineTotal().subtract(discount).multiply(Order.VAT_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getNetAmount() {
        return getLineTotal().subtract(discount).add(vat);
    }

    public int getProductId() { return productId; }

    public String getProductName() { return productName; }

    public BigDecimal getUnitPrice() { return unitPrice; }

    public int getQuantity() { return quantity; }

    public BigDecimal getDiscount() { return discount; }

    public BigDecimal getVat() { return vat; }

    public void setQuantity(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        this.quantity = quantity;
    }
}

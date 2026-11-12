package com.kfc.pos.model;

import java.math.BigDecimal;

/**
 * One line on the receipt, e.g. "2 x Chickenjoy 1pc @ 99.00".
 * ENCAPSULATION: the line total is always calculated, never set by hand.
 */
public class OrderItem {

    private final int productId;
    private final String productName;
    private final BigDecimal unitPrice;
    private int quantity;

    public OrderItem(int productId, String productName, BigDecimal unitPrice, int quantity) {
        this.productId = productId;
        this.productName = productName;
        this.unitPrice = Validator.requireMoney(unitPrice, "Unit price");
        setQuantity(quantity);
    }

    public BigDecimal getLineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public int getProductId() { return productId; }

    public String getProductName() { return productName; }

    public BigDecimal getUnitPrice() { return unitPrice; }

    public int getQuantity() { return quantity; }

    public void setQuantity(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        this.quantity = quantity;
    }
}

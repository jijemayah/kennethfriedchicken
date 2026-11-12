package com.kfc.pos.model;

import java.time.OffsetDateTime;

/**
 * ENCAPSULATION: stock quantity has no public setter.
 * It can only change through addStock() / removeStock(), which make sure
 * the quantity never goes below zero.
 */
public class InventoryItem {

    private final int productId;
    private final String productName;
    private final String categoryName;
    private int quantity;
    private int reorderLevel;
    private OffsetDateTime updatedAt;

    public InventoryItem(int productId, String productName, String categoryName,
                         int quantity, int reorderLevel, OffsetDateTime updatedAt) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        this.productId = productId;
        this.productName = productName;
        this.categoryName = categoryName;
        this.quantity = quantity;
        setReorderLevel(reorderLevel);
        this.updatedAt = updatedAt;
    }

    public void addStock(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount to add must be more than zero");
        }
        quantity += amount;
    }

    public void removeStock(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount to remove must be more than zero");
        }
        if (amount > quantity) {
            throw new IllegalArgumentException("Not enough stock for " + productName
                    + " (only " + quantity + " left)");
        }
        quantity -= amount;
    }

    public boolean isLowStock() {
        return quantity <= reorderLevel;
    }

    public int getProductId() { return productId; }

    public String getProductName() { return productName; }

    public String getCategoryName() { return categoryName; }

    public int getQuantity() { return quantity; }

    public int getReorderLevel() { return reorderLevel; }

    public void setReorderLevel(int reorderLevel) {
        if (reorderLevel < 0) {
            throw new IllegalArgumentException("Reorder level cannot be negative");
        }
        this.reorderLevel = reorderLevel;
    }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}

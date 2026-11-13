package com.kfc.pos.model;

import java.math.BigDecimal;

public class Product {
    private int id;
    private int categoryId;
    private String categoryName;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private boolean active;
    private int stockQuantity;

    public Product(int id, int categoryId, String name, String description,
                   BigDecimal price, String imageUrl, boolean active) {
        this.id = id;
        setCategoryId(categoryId);
        setName(name);
        setDescription(description);
        setPrice(price);
        setImageUrl(imageUrl);
        this.active = active;
    }

    public boolean isAvailable() {
        return active && stockQuantity > 0;
    }

    public int getId() { return id; }

    public void setId(int id) { this.id = id; }

    public int getCategoryId() { return categoryId; }

    public void setCategoryId(int categoryId) {
        if (categoryId <= 0) {
            throw new IllegalArgumentException("Category is required");
        }
        this.categoryId = categoryId;
    }

    public String getCategoryName() { return categoryName; }

    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getName() { return name; }

    public void setName(String name) {
        this.name = Validator.requireText(name, "Product name", 100);
    }

    public String getDescription() { return description; }

    public void setDescription(String description) {
        this.description = Validator.optionalText(description, 255);
    }

    public BigDecimal getPrice() { return price; }

    public void setPrice(BigDecimal price) {
        this.price = Validator.requireMoney(price, "Price");
    }

    public String getImageUrl() { return imageUrl; }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = Validator.optionalText(imageUrl, 500);
    }

    public boolean isActive() { return active; }

    public void setActive(boolean active) { this.active = active; }

    public int getStockQuantity() { return stockQuantity; }

    public void setStockQuantity(int stockQuantity) { this.stockQuantity = stockQuantity; }
}

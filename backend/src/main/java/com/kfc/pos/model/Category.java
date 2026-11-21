package com.kfc.pos.model;

public class Category {
    private int id;
    private String name;
    private String description;
    private int productCount;
    private boolean driveThru = true;

    public Category(int id, String name, String description) {
        this.id = id;
        setName(name);
        setDescription(description);
    }

    public int getId() { return id; }

    public void setId(int id) { this.id = id; }

    public String getName() { return name; }

    public void setName(String name) {
        this.name = Validator.requireText(name, "Category name", 60);
    }

    public String getDescription() { return description; }

    public void setDescription(String description) {
        this.description = Validator.optionalText(description, 255);
    }

    public boolean isDriveThru() { return driveThru; }

    public void setDriveThru(boolean driveThru) { this.driveThru = driveThru; }

    public int getProductCount() { return productCount; }

    public void setProductCount(int productCount) { this.productCount = productCount; }
}

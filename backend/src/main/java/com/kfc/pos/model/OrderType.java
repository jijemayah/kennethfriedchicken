package com.kfc.pos.model;

public enum OrderType {
    DINE_IN("Dine in"),
    TAKE_OUT("Take out"),
    DELIVERY("Delivery"),
    FOOD_APP("Food delivery app"),
    DRIVE_THRU("Drive-thru");

    private final String label;

    OrderType(String label) {
        this.label = label;
    }

    public String getLabel() { return label; }

    public boolean needsCustomerName() {
        return this == DELIVERY || this == FOOD_APP;
    }

    public boolean isDelivery() {
        return this == DELIVERY || this == FOOD_APP;
    }

    public static OrderType parse(String value) {
        if (value == null || value.isBlank()) {
            return DINE_IN;
        }
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Order type must be DINE_IN, TAKE_OUT, DELIVERY, FOOD_APP or DRIVE_THRU");
        }
    }
}

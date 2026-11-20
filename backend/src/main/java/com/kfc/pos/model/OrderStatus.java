package com.kfc.pos.model;

import java.util.ArrayList;
import java.util.List;

public enum OrderStatus {
    PREPARING("Preparing"),
    READY("Ready"),
    OUT_FOR_DELIVERY("Out for delivery"),
    COMPLETED("Completed");

    private final String label;

    OrderStatus(String label) {
        this.label = label;
    }

    public String getLabel() { return label; }

    public boolean isAllowedFor(OrderType type) {
        return this != OUT_FOR_DELIVERY || type.isDelivery();
    }

    public OrderStatus next(OrderType type) {
        for (int i = ordinal() + 1; i < values().length; i++) {
            if (values()[i].isAllowedFor(type)) {
                return values()[i];
            }
        }
        return null;
    }

    public static List<OrderStatus> allowedFor(OrderType type) {
        List<OrderStatus> list = new ArrayList<>();
        for (OrderStatus status : values()) {
            if (status.isAllowedFor(type)) {
                list.add(status);
            }
        }
        return list;
    }

    public static OrderStatus parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Order status is required");
        }
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Order status must be PREPARING, READY, OUT_FOR_DELIVERY or COMPLETED");
        }
    }
}

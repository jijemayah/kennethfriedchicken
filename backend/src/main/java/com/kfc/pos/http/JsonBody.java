package com.kfc.pos.http;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Wraps a parsed JSON object and offers typed getters,
 * so handlers can write body.getInt("quantity") instead of casting.
 */
public class JsonBody {

    private final Map<String, Object> values;

    @SuppressWarnings("unchecked")
    public JsonBody(Object parsed) {
        if (!(parsed instanceof Map)) {
            throw new IllegalArgumentException("Request body must be a JSON object");
        }
        this.values = (Map<String, Object>) parsed;
    }

    public boolean has(String key) {
        return values.get(key) != null;
    }

    public String getString(String key) {
        Object value = values.get(key);
        return value == null ? null : value.toString();
    }

    public BigDecimal getDecimal(String key) {
        Object value = values.get(key);
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value.toString().trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    public Integer getInt(String key) {
        BigDecimal value = getDecimal(key);
        if (value == null) {
            return null;
        }
        try {
            return value.intValueExact();
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException(key + " must be a whole number");
        }
    }

    public int getInt(String key, int fallback) {
        Integer value = getInt(key);
        return value == null ? fallback : value;
    }

    public boolean getBoolean(String key, boolean fallback) {
        Object value = values.get(key);
        return value instanceof Boolean b ? b : fallback;
    }

    /** A list of nested JSON objects, e.g. the cart items. */
    public List<JsonBody> getObjects(String key) {
        Object value = values.get(key);
        List<JsonBody> list = new ArrayList<>();
        if (value instanceof List<?> items) {
            for (Object item : items) {
                list.add(new JsonBody(item));
            }
        }
        return list;
    }

    public JsonBody getObject(String key) {
        Object value = values.get(key);
        return value == null ? null : new JsonBody(value);
    }
}

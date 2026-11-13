package com.kfc.pos.model;

import java.math.BigDecimal;
import java.util.regex.Pattern;

public final class Validator {
    public static final Pattern USERNAME = Pattern.compile("^[a-z0-9._]{4,20}$");

    public static final Pattern PH_MOBILE = Pattern.compile("^09\\d{9}$");

    public static final Pattern EMAIL = Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");

    public static final Pattern PASSWORD = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,64}$");

    private Validator() { }

    public static String requireText(String value, String field, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new IllegalArgumentException(field + " must be at most " + maxLength + " characters");
        }
        return trimmed;
    }

    public static String optionalText(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    public static String requireUsername(String value) {
        String username = value == null ? "" : value.trim().toLowerCase();
        if (!USERNAME.matcher(username).matches()) {
            throw new IllegalArgumentException(
                    "Username must be 4-20 characters: lowercase letters, numbers, dot or underscore");
        }
        return username;
    }

    public static void requirePassword(String value) {
        if (value == null || !PASSWORD.matcher(value).matches()) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters and contain a letter and a number");
        }
    }

    public static BigDecimal requireMoney(BigDecimal value, String field) {
        if (value == null || value.signum() < 0) {
            throw new IllegalArgumentException(field + " must be zero or more");
        }
        return value.setScale(2, java.math.RoundingMode.HALF_UP);
    }
}

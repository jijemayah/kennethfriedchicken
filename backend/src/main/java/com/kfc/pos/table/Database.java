package com.kfc.pos.table;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class Database {
    private static final Map<String, String> DOT_ENV = loadDotEnv();

    private Database() { }

    public static Connection getConnection() throws SQLException {
        String url = require("DB_URL");
        return DriverManager.getConnection(url, require("DB_USER"), require("DB_PASSWORD"));
    }

    public static String env(String name, String fallback) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            value = DOT_ENV.get(name);
        }
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String require(String name) throws SQLException {
        String value = env(name, null);
        if (value == null) {
            throw new SQLException("Missing environment variable " + name + " (see backend/.env.example)");
        }
        return value;
    }

    private static Map<String, String> loadDotEnv() {
        Map<String, String> values = new HashMap<>();
        Path file = Path.of(".env");
        if (!Files.exists(file)) {
            return values;
        }
        try {
            List<String> lines = Files.readAllLines(file);
            for (String line : lines) {
                String trimmed = line.trim();
                int equals = trimmed.indexOf('=');
                if (trimmed.isEmpty() || trimmed.startsWith("#") || equals < 1) {
                    continue;
                }
                String key = trimmed.substring(0, equals).trim();
                String value = trimmed.substring(equals + 1).trim();
                if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
                    value = value.substring(1, value.length() - 1);
                }
                values.put(key, value);
            }
        } catch (IOException e) {
            System.err.println("Could not read .env: " + e.getMessage());
        }
        return values;
    }
}

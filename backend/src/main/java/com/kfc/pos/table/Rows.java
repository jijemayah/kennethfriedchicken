package com.kfc.pos.table;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

final class Rows {
    private static final Pattern SNAKE = Pattern.compile("_([a-z])");

    private Rows() { }

    static List<Map<String, Object>> list(Connection conn, String sql, Object... params) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            try (ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData meta = rs.getMetaData();
                List<Map<String, Object>> rows = new ArrayList<>();
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= meta.getColumnCount(); i++) {
                        row.put(camelCase(meta.getColumnLabel(i)), rs.getObject(i));
                    }
                    rows.add(row);
                }
                return rows;
            }
        }
    }

    static Map<String, Object> one(Connection conn, String sql, Object... params) throws SQLException {
        List<Map<String, Object>> rows = list(conn, sql, params);
        return rows.isEmpty() ? new LinkedHashMap<>() : rows.get(0);
    }

    private static String camelCase(String column) {
        return SNAKE.matcher(column).replaceAll(m -> m.group(1).toUpperCase());
    }
}

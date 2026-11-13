package com.kfc.pos.table;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DashboardTable {

    private static final String TODAY = "(now() AT TIME ZONE 'Asia/Manila')::date";
    private static final String ORDER_DAY = "(o.created_at AT TIME ZONE 'Asia/Manila')::date";

    public Map<String, Object> summary() throws SQLException {
        Map<String, Object> result = new LinkedHashMap<>();
        try (Connection conn = Database.getConnection()) {
            String totals = "SELECT "
                    + "COALESCE(SUM(total) FILTER (WHERE " + ORDER_DAY + " = " + TODAY + "), 0) AS today_sales, "
                    + "COUNT(*) FILTER (WHERE " + ORDER_DAY + " = " + TODAY + ") AS today_orders, "
                    + "COALESCE(SUM(total) FILTER (WHERE " + ORDER_DAY + " >= " + TODAY + " - 6), 0) AS week_sales, "
                    + "COALESCE(SUM(total), 0) AS total_sales, COUNT(*) AS total_orders, "
                    + "COALESCE(ROUND(AVG(total), 2), 0) AS average_order "
                    + "FROM orders o WHERE o.status = 'COMPLETED'";
            result.putAll(one(conn, totals));

            result.put("salesByDay", list(conn,
                    "SELECT to_char(d.day, 'YYYY-MM-DD') AS date, to_char(d.day, 'Dy') AS label, "
                    + "COALESCE(SUM(o.total), 0) AS sales, COUNT(o.order_id) AS orders "
                    + "FROM generate_series(" + TODAY + " - 6, " + TODAY + ", INTERVAL '1 day') AS d(day) "
                    + "LEFT JOIN orders o ON " + ORDER_DAY + " = d.day::date AND o.status = 'COMPLETED' "
                    + "GROUP BY d.day ORDER BY d.day"));

            result.put("topProducts", list(conn,
                    "SELECT oi.product_name AS name, SUM(oi.quantity) AS quantity, SUM(oi.line_total) AS sales "
                    + "FROM order_item oi JOIN orders o ON o.order_id = oi.order_id AND o.status = 'COMPLETED' "
                    + "GROUP BY oi.product_name ORDER BY quantity DESC LIMIT 5"));

            result.put("paymentMethods", list(conn,
                    "SELECT p.method, COUNT(*) AS count, SUM(p.amount_due) AS amount FROM payment p "
                    + "JOIN orders o ON o.order_id = p.order_id AND o.status = 'COMPLETED' "
                    + "GROUP BY p.method ORDER BY amount DESC"));

            result.put("lowStock", list(conn,
                    "SELECT p.product_id AS \"productId\", p.name, i.quantity, i.reorder_level AS \"reorderLevel\" "
                    + "FROM inventory i JOIN product p ON p.product_id = i.product_id "
                    + "WHERE p.is_active AND i.quantity <= i.reorder_level ORDER BY i.quantity LIMIT 6"));

            result.put("recentOrders", list(conn,
                    "SELECT o.order_id AS id, o.total, o.created_at AS \"createdAt\", p.method, "
                    + "COALESCE(c.full_name, 'Walk-in') AS customer "
                    + "FROM orders o LEFT JOIN payment p ON p.order_id = o.order_id "
                    + "LEFT JOIN customer c ON c.customer_id = o.customer_id "
                    + "ORDER BY o.created_at DESC LIMIT 5"));
        }
        return result;
    }

    private Map<String, Object> one(Connection conn, String sql) throws SQLException {
        List<Map<String, Object>> rows = list(conn, sql);
        return rows.isEmpty() ? new LinkedHashMap<>() : rows.get(0);
    }

    private List<Map<String, Object>> list(Connection conn, String sql) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            int columns = rs.getMetaData().getColumnCount();
            List<Map<String, Object>> rows = new ArrayList<>();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= columns; i++) {
                    row.put(toCamelCase(rs.getMetaData().getColumnLabel(i)), rs.getObject(i));
                }
                rows.add(row);
            }
            return rows;
        }
    }

    private String toCamelCase(String column) {
        return java.util.regex.Pattern.compile("_([a-z])").matcher(column)
                .replaceAll(m -> m.group(1).toUpperCase());
    }
}

package com.kfc.pos.table;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Dashboard numbers. Sales are net: orders rung up in the period minus orders voided/refunded in the period
 * (a refund counts on the day it was given).
 */
public class DashboardTable {
    static final String TODAY = "(now() AT TIME ZONE 'Asia/Manila')::date";
    static final String ORDER_DAY = "(o.created_at AT TIME ZONE 'Asia/Manila')::date";
    static final String CANCEL_DAY = "(o.cancelled_at AT TIME ZONE 'Asia/Manila')::date";

    private static String netSales(String dayCondition) {
        return "COALESCE(SUM(o.total) FILTER (WHERE " + ORDER_DAY + dayCondition + "), 0) - "
                + "COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'COMPLETED' AND " + CANCEL_DAY + dayCondition
                + "), 0)";
    }

    /** Managers: everything, including the last 7 days, all-time numbers and low stock. */
    public Map<String, Object> managerSummary() throws SQLException {
        Map<String, Object> result = new LinkedHashMap<>();
        try (Connection conn = Database.getConnection()) {
            result.put("scope", "ALL");
            result.putAll(Rows.one(conn, "SELECT "
                    + netSales(" = " + TODAY) + " AS today_sales, "
                    + "COUNT(*) FILTER (WHERE " + ORDER_DAY + " = " + TODAY + " AND o.status <> 'VOIDED') AS today_orders, "
                    + netSales(" >= " + TODAY + " - 6") + " AS week_sales, "
                    + "COUNT(*) FILTER (WHERE o.status = 'COMPLETED') AS total_orders, "
                    + "COALESCE(ROUND(AVG(o.total) FILTER (WHERE o.status = 'COMPLETED' AND " + ORDER_DAY
                    + " >= " + TODAY + " - 6), 2), 0) AS average_order, "
                    + "COUNT(*) FILTER (WHERE o.status <> 'COMPLETED' AND " + CANCEL_DAY + " = " + TODAY
                    + ") AS today_cancelled "
                    + "FROM orders o"));

            result.put("salesByDay", Rows.list(conn,
                    "SELECT to_char(d.day, 'YYYY-MM-DD') AS date, to_char(d.day, 'Dy') AS label, "
                    + "(SELECT " + netSales(" = d.day::date") + " FROM orders o) AS sales, "
                    + "(SELECT COUNT(*) FROM orders o WHERE " + ORDER_DAY + " = d.day::date "
                    + "AND o.status <> 'VOIDED') AS orders "
                    + "FROM generate_series(" + TODAY + " - 6, " + TODAY + ", INTERVAL '1 day') AS d(day) "
                    + "ORDER BY d.day"));

            result.put("topProducts", topProducts(conn, ""));
            result.put("paymentMethods", paymentMethods(conn, ""));

            result.put("lowStock", Rows.list(conn,
                    "SELECT p.product_id AS \"productId\", p.name, i.quantity, i.reorder_level AS \"reorderLevel\" "
                    + "FROM inventory i JOIN product p ON p.product_id = i.product_id "
                    + "WHERE p.is_active AND i.quantity <= i.reorder_level ORDER BY i.quantity LIMIT 6"));

            result.put("recentOrders", recentOrders(conn, ""));
        }
        return result;
    }

    /** Cashiers: today only (resets at midnight, UTC+8), plus their own transaction count. */
    public Map<String, Object> cashierSummary(int employeeId) throws SQLException {
        Map<String, Object> result = new LinkedHashMap<>();
        String today = " AND " + ORDER_DAY + " = " + TODAY;
        try (Connection conn = Database.getConnection()) {
            result.put("scope", "TODAY");
            result.putAll(Rows.one(conn, "SELECT "
                    + netSales(" = " + TODAY) + " AS today_sales, "
                    + "COUNT(*) FILTER (WHERE " + ORDER_DAY + " = " + TODAY + " AND o.status <> 'VOIDED') AS today_orders, "
                    + "COUNT(*) FILTER (WHERE " + ORDER_DAY + " = " + TODAY
                    + " AND o.status <> 'VOIDED' AND o.employee_id = ?) AS my_orders, "
                    + "COALESCE(ROUND(AVG(o.total) FILTER (WHERE o.status = 'COMPLETED' AND " + ORDER_DAY
                    + " = " + TODAY + "), 2), 0) AS average_order, "
                    + "COUNT(*) FILTER (WHERE o.status <> 'COMPLETED' AND " + CANCEL_DAY + " = " + TODAY
                    + ") AS today_cancelled "
                    + "FROM orders o", employeeId));

            String hourOf = "EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'Asia/Manila')::int";
            String nowHour = "EXTRACT(HOUR FROM now() AT TIME ZONE 'Asia/Manila')::int";
            result.put("salesByHour", Rows.list(conn,
                    "SELECT h.hour, to_char(make_time(h.hour, 0, 0), 'FMHH12 AM') AS label, "
                    + "COALESCE(SUM(o.total), 0) AS sales, COUNT(o.order_id) AS orders "
                    + "FROM generate_series(LEAST(8, " + nowHour + ", (SELECT MIN(" + hourOf + ") FROM orders o "
                    + "WHERE " + ORDER_DAY + " = " + TODAY + ")), " + nowHour + ") AS h(hour) "
                    + "LEFT JOIN orders o ON o.status = 'COMPLETED' AND " + ORDER_DAY + " = " + TODAY
                    + " AND " + hourOf + " = h.hour "
                    + "GROUP BY h.hour ORDER BY h.hour"));

            result.put("topProducts", topProducts(conn, today));
            result.put("paymentMethods", paymentMethods(conn, today));
            result.put("recentOrders", recentOrders(conn, today));
        }
        return result;
    }

    private static Object topProducts(Connection conn, String filter) throws SQLException {
        return Rows.list(conn,
                "SELECT p.name, SUM(oi.quantity) AS quantity, SUM(oi.line_total) AS sales "
                + "FROM order_item oi JOIN orders o ON o.order_id = oi.order_id AND o.status = 'COMPLETED'" + filter
                + " JOIN product p ON p.product_id = oi.product_id "
                + "GROUP BY p.product_id, p.name ORDER BY quantity DESC, p.name LIMIT 5");
    }

    private static Object paymentMethods(Connection conn, String filter) throws SQLException {
        return Rows.list(conn,
                "SELECT p.method, COUNT(*) AS count, SUM(p.amount_due) AS amount FROM payment p "
                + "JOIN orders o ON o.order_id = p.order_id AND o.status = 'COMPLETED'" + filter
                + " GROUP BY p.method ORDER BY amount DESC");
    }

    private static Object recentOrders(Connection conn, String filter) throws SQLException {
        return Rows.list(conn,
                "SELECT o.order_id AS id, o.total, o.created_at AS \"createdAt\", o.status, p.method, "
                + "o.order_type AS \"orderType\", COALESCE(c.full_name, 'Walk-in') AS customer "
                + "FROM orders o LEFT JOIN payment p ON p.order_id = o.order_id "
                + "LEFT JOIN customer c ON c.customer_id = o.customer_id "
                + "WHERE 1 = 1" + filter + " ORDER BY o.created_at DESC LIMIT 5");
    }
}

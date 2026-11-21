package com.kfc.pos.table;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

public class ReportTable {
    private static final String RANGE_CTE =
            "WITH rung AS (SELECT o.*, p.method FROM orders o JOIN payment p ON p.order_id = o.order_id "
            + "WHERE " + DashboardTable.ORDER_DAY + " BETWEEN ? AND ?), "
            + "cancelled AS (SELECT o.*, p.method FROM orders o JOIN payment p ON p.order_id = o.order_id "
            + "WHERE o.status <> 'COMPLETED' AND " + DashboardTable.CANCEL_DAY + " BETWEEN ? AND ?) ";

    public Map<String, Object> salesReport(LocalDate from, LocalDate to, boolean perCashier, int viewerId)
            throws SQLException {
        Date a = Date.valueOf(from);
        Date b = Date.valueOf(to);
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("from", from.toString());
        report.put("to", to.toString());

        try (Connection conn = Database.getConnection()) {
            Map<String, Object> summary = Rows.one(conn, RANGE_CTE + "SELECT "
                    + "(SELECT COUNT(*) FROM rung) AS transactions, "
                    + "(SELECT COUNT(*) FROM rung WHERE employee_id = ?) AS your_transactions, "
                    + "(SELECT MIN(order_id) FROM rung) AS first_order_id, "
                    + "(SELECT MAX(order_id) FROM rung) AS last_order_id, "
                    + "(SELECT COALESCE(SUM(subtotal), 0) FROM rung) AS subtotal, "
                    + "(SELECT COALESCE(SUM(discount), 0) FROM rung) AS discounts, "
                    + "(SELECT COALESCE(SUM(discount), 0) FROM rung WHERE discount_type IN ('SENIOR', 'PWD')) AS senior_pwd_discount, "
                    + "(SELECT COUNT(*) FROM rung WHERE discount_type IN ('SENIOR', 'PWD')) AS senior_pwd_count, "
                    + "(SELECT COALESCE(SUM(discount), 0) FROM rung WHERE discount_type = 'EMPLOYEE') AS employee_discount, "
                    + "(SELECT COUNT(*) FROM rung WHERE discount_type = 'EMPLOYEE') AS employee_discount_count, "
                    + "(SELECT COALESCE(SUM(subtotal - discount), 0) FROM rung WHERE discount_type NOT IN ('SENIOR', 'PWD')) AS vatable_sales, "
                    + "(SELECT COALESCE(SUM(subtotal - discount), 0) FROM rung WHERE discount_type IN ('SENIOR', 'PWD')) AS vat_exempt_sales, "
                    + "(SELECT COALESCE(SUM(vat), 0) FROM rung) AS vat, "
                    + "(SELECT COALESCE(SUM(total), 0) FROM rung) AS gross_sales, "
                    + "(SELECT COUNT(*) FROM cancelled WHERE status = 'VOIDED') AS void_count, "
                    + "(SELECT COALESCE(SUM(total), 0) FROM cancelled WHERE status = 'VOIDED') AS void_amount, "
                    + "(SELECT COUNT(*) FROM cancelled WHERE status = 'REFUNDED') AS refund_count, "
                    + "(SELECT COALESCE(SUM(total), 0) FROM cancelled WHERE status = 'REFUNDED') AS refund_amount",
                    a, b, a, b, viewerId);
            BigDecimal gross = (BigDecimal) summary.get("grossSales");
            BigDecimal cut = ((BigDecimal) summary.get("voidAmount")).add((BigDecimal) summary.get("refundAmount"));
            summary.put("cancelledAmount", cut);
            summary.put("netSales", gross.subtract(cut));
            report.put("summary", summary);

            String breakdown = "SELECT %s, SUM(cnt) AS count, SUM(gross) AS gross, SUM(cut) AS cancelled, "
                    + "SUM(gross) - SUM(cut) AS net FROM ("
                    + "SELECT %s, 1 AS cnt, total AS gross, 0 AS cut FROM rung UNION ALL "
                    + "SELECT %s, 0, 0, total FROM cancelled) t GROUP BY %s ORDER BY net DESC";
            report.put("paymentMethods", Rows.list(conn, RANGE_CTE
                    + String.format(breakdown, "method", "method", "method", "method"), a, b, a, b));
            report.put("orderTypes", Rows.list(conn, RANGE_CTE
                    + String.format(breakdown, "order_type", "order_type", "order_type", "order_type"), a, b, a, b));
            if (perCashier) {
                report.put("cashiers", Rows.list(conn, RANGE_CTE
                        + "SELECT e.employee_no, e.first_name || ' ' || e.last_name AS name, t.count, t.gross, "
                        + "t.cancelled, t.net FROM ("
                        + String.format(breakdown, "employee_id", "employee_id", "employee_id", "employee_id")
                        + ") t JOIN employee e ON e.employee_id = t.employee_id ORDER BY t.net DESC", a, b, a, b));
            }

            report.put("days", Rows.list(conn, RANGE_CTE
                    + "SELECT to_char(day, 'YYYY-MM-DD') AS date, SUM(cnt) AS orders, SUM(gross) AS gross, "
                    + "SUM(cut) AS cancelled, SUM(gross) - SUM(cut) AS net FROM ("
                    + "SELECT (created_at AT TIME ZONE 'Asia/Manila')::date AS day, 1 AS cnt, total AS gross, 0 AS cut FROM rung "
                    + "UNION ALL SELECT (cancelled_at AT TIME ZONE 'Asia/Manila')::date, 0, 0, total FROM cancelled"
                    + ") t GROUP BY day ORDER BY day", a, b, a, b));

            report.put("inventory", Rows.list(conn, RANGE_CTE
                    + "SELECT p.product_id, p.name, c.name AS category, COALESCE(s.sold, 0) AS sold, "
                    + "COALESCE(r.returned, 0) AS returned, COALESCE(i.quantity, 0) AS stock_now, "
                    + "COALESCE(i.reorder_level, 0) AS reorder_level, "
                    + "COALESCE(i.quantity <= i.reorder_level, FALSE) AS low_stock FROM "
                    + "(SELECT oi.product_id, SUM(oi.quantity) AS sold FROM order_item oi "
                    + " JOIN rung ON rung.order_id = oi.order_id GROUP BY oi.product_id) s "
                    + "FULL JOIN (SELECT oi.product_id, SUM(oi.quantity) AS returned FROM order_item oi "
                    + " JOIN cancelled x ON x.order_id = oi.order_id AND x.status = 'VOIDED' GROUP BY oi.product_id) r "
                    + "ON r.product_id = s.product_id "
                    + "JOIN product p ON p.product_id = COALESCE(s.product_id, r.product_id) "
                    + "JOIN category c ON c.category_id = p.category_id "
                    + "LEFT JOIN inventory i ON i.product_id = p.product_id "
                    + "ORDER BY sold DESC, p.name", a, b, a, b));
        }
        return report;
    }
}

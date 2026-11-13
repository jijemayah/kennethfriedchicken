package com.kfc.pos.table;

import com.kfc.pos.model.Order;
import com.kfc.pos.model.OrderItem;
import com.kfc.pos.payment.Payment;
import com.kfc.pos.payment.PaymentRecord;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class OrderTable {

    private static final String SELECT =
            "SELECT o.order_id, o.employee_id, e.first_name || ' ' || e.last_name AS employee_name, "
            + "o.customer_id, c.full_name AS customer_name, o.subtotal, o.vat, o.total, o.status, o.created_at, "
            + "p.method, p.amount_due, p.amount_tendered, p.change_amount, p.reference_no, p.details, p.paid_at, "
            + "(SELECT COALESCE(SUM(oi.quantity), 0) FROM order_item oi WHERE oi.order_id = o.order_id) AS item_count "
            + "FROM orders o JOIN employee e ON e.employee_id = o.employee_id "
            + "LEFT JOIN customer c ON c.customer_id = o.customer_id "
            + "LEFT JOIN payment p ON p.order_id = o.order_id ";

    private static final String LOCAL_DATE = "(o.created_at AT TIME ZONE 'Asia/Manila')::date";

    public List<OrderSummary> search(LocalDate from, LocalDate to, String method, String text) throws SQLException {
        StringBuilder sql = new StringBuilder(SELECT + "WHERE 1 = 1 ");
        List<Object> params = new ArrayList<>();
        if (from != null) {
            sql.append("AND ").append(LOCAL_DATE).append(" >= ? ");
            params.add(Date.valueOf(from));
        }
        if (to != null) {
            sql.append("AND ").append(LOCAL_DATE).append(" <= ? ");
            params.add(Date.valueOf(to));
        }
        if (method != null) {
            sql.append("AND p.method = ? ");
            params.add(method);
        }
        if (text != null) {
            sql.append("AND (CAST(o.order_id AS TEXT) LIKE ? OR c.full_name ILIKE ? "
                    + "OR (e.first_name || ' ' || e.last_name) ILIKE ?) ");
            String digits = text.replaceAll("\\D", "").replaceFirst("^0+", "");
            params.add("%" + (digits.isEmpty() ? text : digits) + "%");
            params.add("%" + text + "%");
            params.add("%" + text + "%");
        }
        sql.append("ORDER BY o.created_at DESC LIMIT 300");

        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                List<OrderSummary> list = new ArrayList<>();
                while (rs.next()) {
                    list.add(new OrderSummary(mapOrder(rs), rs.getInt("item_count")));
                }
                return list;
            }
        }
    }

    public Optional<Order> findById(int id) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            Order order;
            try (PreparedStatement ps = conn.prepareStatement(SELECT + "WHERE o.order_id = ?")) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        return Optional.empty();
                    }
                    order = mapOrder(rs);
                }
            }
            String itemsSql = "SELECT product_id, product_name, unit_price, quantity FROM order_item "
                    + "WHERE order_id = ? ORDER BY order_item_id";
            try (PreparedStatement ps = conn.prepareStatement(itemsSql)) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        order.loadItem(new OrderItem(rs.getInt("product_id"), rs.getString("product_name"),
                                rs.getBigDecimal("unit_price"), rs.getInt("quantity")));
                    }
                }
            }
            return Optional.of(order);
        }
    }

    public int insert(Connection conn, Order order, Payment payment) throws SQLException {
        String orderSql = "INSERT INTO orders (employee_id, customer_id, subtotal, vat, total) "
                + "VALUES (?, ?, ?, ?, ?) RETURNING order_id, created_at";
        int orderId;
        try (PreparedStatement ps = conn.prepareStatement(orderSql)) {
            ps.setInt(1, order.getEmployeeId());
            ps.setObject(2, order.getCustomerId());
            ps.setBigDecimal(3, order.getSubtotal());
            ps.setBigDecimal(4, order.getVat());
            ps.setBigDecimal(5, order.getTotal());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                orderId = rs.getInt("order_id");
                order.setId(orderId);
                order.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
            }
        }

        String itemSql = "INSERT INTO order_item (order_id, product_id, product_name, quantity, unit_price, line_total) "
                + "VALUES (?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(itemSql)) {
            for (OrderItem item : order.getItems()) {
                ps.setInt(1, orderId);
                ps.setInt(2, item.getProductId());
                ps.setString(3, item.getProductName());
                ps.setInt(4, item.getQuantity());
                ps.setBigDecimal(5, item.getUnitPrice());
                ps.setBigDecimal(6, item.getLineTotal());
                ps.addBatch();
            }
            ps.executeBatch();
        }

        String paymentSql = "INSERT INTO payment (order_id, method, amount_due, amount_tendered, change_amount, "
                + "reference_no, details) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(paymentSql)) {
            ps.setInt(1, orderId);
            ps.setString(2, payment.getMethod());
            ps.setBigDecimal(3, payment.getAmountDue());
            ps.setBigDecimal(4, payment.getAmountTendered());
            ps.setBigDecimal(5, payment.getChange());
            ps.setString(6, payment.getReferenceNumber());
            ps.setString(7, payment.getDetails());
            ps.executeUpdate();
        }
        return orderId;
    }

    private Order mapOrder(ResultSet rs) throws SQLException {
        Order order = new Order(rs.getInt("order_id"), rs.getInt("employee_id"), rs.getString("employee_name"),
                (Integer) rs.getObject("customer_id"), rs.getString("customer_name"),
                rs.getBigDecimal("subtotal"), rs.getBigDecimal("vat"), rs.getBigDecimal("total"),
                rs.getString("status"), rs.getObject("created_at", OffsetDateTime.class));
        if (rs.getString("method") != null) {
            order.setPayment(new PaymentRecord(rs.getString("method"), rs.getBigDecimal("amount_due"),
                    rs.getBigDecimal("amount_tendered"), rs.getBigDecimal("change_amount"),
                    rs.getString("reference_no"), rs.getString("details"),
                    rs.getObject("paid_at", OffsetDateTime.class)));
        }
        return order;
    }

    /** An order plus its item count, for the history table. A Java record keeps it short. */
    public record OrderSummary(Order order, int itemCount) { }
}

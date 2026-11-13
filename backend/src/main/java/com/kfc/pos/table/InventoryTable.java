package com.kfc.pos.table;

import com.kfc.pos.model.InventoryItem;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class InventoryTable {
    private static final String SELECT =
            "SELECT i.product_id, p.name AS product_name, c.name AS category_name, i.quantity, "
            + "i.reorder_level, i.updated_at FROM inventory i "
            + "JOIN product p ON p.product_id = i.product_id "
            + "JOIN category c ON c.category_id = p.category_id ";

    public List<InventoryItem> findAll() throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT + "WHERE p.is_active ORDER BY i.quantity, p.name");
             ResultSet rs = ps.executeQuery()) {
            List<InventoryItem> list = new ArrayList<>();
            while (rs.next()) {
                list.add(map(rs));
            }
            return list;
        }
    }

    public Optional<InventoryItem> findByProductId(int productId) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            return findByProductId(conn, productId, false);
        }
    }

    public Optional<InventoryItem> findByProductId(Connection conn, int productId, boolean forUpdate)
            throws SQLException {
        String sql = SELECT + "WHERE i.product_id = ?" + (forUpdate ? " FOR UPDATE OF i" : "");
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, productId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public void save(InventoryItem item) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            save(conn, item);
        }
    }

    public void save(Connection conn, InventoryItem item) throws SQLException {
        String sql = "UPDATE inventory SET quantity = ?, reorder_level = ?, updated_at = NOW() WHERE product_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, item.getQuantity());
            ps.setInt(2, item.getReorderLevel());
            ps.setInt(3, item.getProductId());
            ps.executeUpdate();
        }
    }

    private InventoryItem map(ResultSet rs) throws SQLException {
        return new InventoryItem(rs.getInt("product_id"), rs.getString("product_name"),
                rs.getString("category_name"), rs.getInt("quantity"), rs.getInt("reorder_level"),
                rs.getObject("updated_at", OffsetDateTime.class));
    }
}

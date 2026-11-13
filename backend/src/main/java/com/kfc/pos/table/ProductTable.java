package com.kfc.pos.table;

import com.kfc.pos.model.Product;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ProductTable implements CrudTable<Product> {

    private static final String SELECT =
            "SELECT p.product_id, p.category_id, c.name AS category_name, p.name, p.description, "
            + "p.price, p.image_url, p.is_active, COALESCE(i.quantity, 0) AS quantity "
            + "FROM product p JOIN category c ON c.category_id = p.category_id "
            + "LEFT JOIN inventory i ON i.product_id = p.product_id ";

    @Override
    public List<Product> findAll() throws SQLException {
        return query(SELECT + "ORDER BY c.category_id, p.name");
    }

    public List<Product> findActive() throws SQLException {
        return query(SELECT + "WHERE p.is_active ORDER BY c.category_id, p.name");
    }

    @Override
    public Optional<Product> findById(int id) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT + "WHERE p.product_id = ?")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    @Override
    public Product create(Product product) throws SQLException {
        String insertProduct = "INSERT INTO product (category_id, name, description, price, image_url, is_active) "
                + "VALUES (?, ?, ?, ?, ?, ?) RETURNING product_id";
        String insertStock = "INSERT INTO inventory (product_id, quantity, reorder_level) VALUES (?, ?, 10)";
        try (Connection conn = Database.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement(insertProduct);
                 PreparedStatement stock = conn.prepareStatement(insertStock)) {
                fill(ps, product);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    product.setId(rs.getInt(1));
                }
                stock.setInt(1, product.getId());
                stock.setInt(2, Math.max(0, product.getStockQuantity()));
                stock.executeUpdate();
                conn.commit();
                return product;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    @Override
    public void update(Product product) throws SQLException {
        String sql = "UPDATE product SET category_id = ?, name = ?, description = ?, price = ?, "
                + "image_url = ?, is_active = ? WHERE product_id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            fill(ps, product);
            ps.setInt(7, product.getId());
            ps.executeUpdate();
        }
    }

    public boolean deleteOrDeactivate(int id) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            boolean used;
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT EXISTS (SELECT 1 FROM order_item WHERE product_id = ?)")) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    used = rs.getBoolean(1);
                }
            }
            String sql = used
                    ? "UPDATE product SET is_active = FALSE WHERE product_id = ?"
                    : "DELETE FROM product WHERE product_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, id);
                ps.executeUpdate();
            }
            return !used;
        }
    }

    @Override
    public void delete(int id) throws SQLException {
        deleteOrDeactivate(id);
    }

    private List<Product> query(String sql) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            List<Product> list = new ArrayList<>();
            while (rs.next()) {
                list.add(map(rs));
            }
            return list;
        }
    }

    private void fill(PreparedStatement ps, Product p) throws SQLException {
        ps.setInt(1, p.getCategoryId());
        ps.setString(2, p.getName());
        ps.setString(3, p.getDescription());
        ps.setBigDecimal(4, p.getPrice());
        ps.setString(5, p.getImageUrl());
        ps.setBoolean(6, p.isActive());
    }

    private Product map(ResultSet rs) throws SQLException {
        Product p = new Product(rs.getInt("product_id"), rs.getInt("category_id"), rs.getString("name"),
                rs.getString("description"), rs.getBigDecimal("price"), rs.getString("image_url"),
                rs.getBoolean("is_active"));
        p.setCategoryName(rs.getString("category_name"));
        p.setStockQuantity(rs.getInt("quantity"));
        return p;
    }
}

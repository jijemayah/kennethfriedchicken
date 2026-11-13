package com.kfc.pos.table;

import com.kfc.pos.model.Category;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class CategoryTable implements CrudTable<Category> {
    private static final String SELECT =
            "SELECT c.category_id, c.name, c.description, COUNT(p.product_id) AS product_count "
            + "FROM category c LEFT JOIN product p ON p.category_id = c.category_id AND p.is_active ";

    @Override
    public List<Category> findAll() throws SQLException {
        String sql = SELECT + "GROUP BY c.category_id ORDER BY c.category_id";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            List<Category> list = new ArrayList<>();
            while (rs.next()) {
                list.add(map(rs));
            }
            return list;
        }
    }

    @Override
    public Optional<Category> findById(int id) throws SQLException {
        String sql = SELECT + "WHERE c.category_id = ? GROUP BY c.category_id";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    @Override
    public Category create(Category category) throws SQLException {
        String sql = "INSERT INTO category (name, description) VALUES (?, ?) RETURNING category_id";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, category.getName());
            ps.setString(2, category.getDescription());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                category.setId(rs.getInt(1));
            }
            return category;
        }
    }

    @Override
    public void update(Category category) throws SQLException {
        String sql = "UPDATE category SET name = ?, description = ? WHERE category_id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, category.getName());
            ps.setString(2, category.getDescription());
            ps.setInt(3, category.getId());
            ps.executeUpdate();
        }
    }

    @Override
    public void delete(int id) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("DELETE FROM category WHERE category_id = ?")) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }

    private Category map(ResultSet rs) throws SQLException {
        Category category = new Category(rs.getInt("category_id"), rs.getString("name"),
                rs.getString("description"));
        category.setProductCount(rs.getInt("product_count"));
        return category;
    }
}

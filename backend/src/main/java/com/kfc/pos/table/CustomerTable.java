package com.kfc.pos.table;

import com.kfc.pos.model.Customer;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class CustomerTable implements CrudTable<Customer> {

    private static final String SELECT = "SELECT customer_id, full_name, phone, email FROM customer ";

    @Override
    public List<Customer> findAll() throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT + "ORDER BY full_name");
             ResultSet rs = ps.executeQuery()) {
            List<Customer> list = new ArrayList<>();
            while (rs.next()) {
                list.add(map(rs));
            }
            return list;
        }
    }

    @Override
    public Optional<Customer> findById(int id) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT + "WHERE customer_id = ?")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    @Override
    public Customer create(Customer c) throws SQLException {
        String sql = "INSERT INTO customer (full_name, phone, email) VALUES (?, ?, ?) RETURNING customer_id";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, c.getFullName());
            ps.setString(2, c.getPhone());
            ps.setString(3, c.getEmail());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                c.setId(rs.getInt(1));
            }
            return c;
        }
    }

    @Override
    public void update(Customer c) throws SQLException {
        String sql = "UPDATE customer SET full_name = ?, phone = ?, email = ? WHERE customer_id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, c.getFullName());
            ps.setString(2, c.getPhone());
            ps.setString(3, c.getEmail());
            ps.setInt(4, c.getId());
            ps.executeUpdate();
        }
    }

    @Override
    public void delete(int id) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("DELETE FROM customer WHERE customer_id = ?")) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }

    private Customer map(ResultSet rs) throws SQLException {
        return new Customer(rs.getInt("customer_id"), rs.getString("full_name"),
                rs.getString("phone"), rs.getString("email"));
    }
}

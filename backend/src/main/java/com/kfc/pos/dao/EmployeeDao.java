package com.kfc.pos.dao;

import com.kfc.pos.model.Employee;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class EmployeeDao implements CrudDao<Employee> {

    private static final String SELECT =
            "SELECT employee_id, first_name, last_name, username, password_hash, role, is_active FROM employee ";

    @Override
    public List<Employee> findAll() throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT + "ORDER BY role DESC, last_name");
             ResultSet rs = ps.executeQuery()) {
            List<Employee> list = new ArrayList<>();
            while (rs.next()) {
                list.add(map(rs));
            }
            return list;
        }
    }

    @Override
    public Optional<Employee> findById(int id) throws SQLException {
        return findOne(SELECT + "WHERE employee_id = ?", ps -> ps.setInt(1, id));
    }

    public Optional<Employee> findByUsername(String username) throws SQLException {
        return findOne(SELECT + "WHERE username = ?", ps -> ps.setString(1, username.trim().toLowerCase()));
    }

    @Override
    public Employee create(Employee e) throws SQLException {
        String sql = "INSERT INTO employee (first_name, last_name, username, password_hash, role, is_active) "
                + "VALUES (?, ?, ?, ?, ?, ?) RETURNING employee_id";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, e.getFirstName());
            ps.setString(2, e.getLastName());
            ps.setString(3, e.getUsername());
            ps.setString(4, e.getPasswordHash());
            ps.setString(5, e.getRole());      // polymorphism: Cashier/Manager answer differently
            ps.setBoolean(6, e.isActive());
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                e.setId(rs.getInt(1));
            }
            return e;
        }
    }

    @Override
    public void update(Employee e) throws SQLException {
        String sql = "UPDATE employee SET first_name = ?, last_name = ?, username = ?, password_hash = ?, "
                + "role = ?, is_active = ? WHERE employee_id = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, e.getFirstName());
            ps.setString(2, e.getLastName());
            ps.setString(3, e.getUsername());
            ps.setString(4, e.getPasswordHash());
            ps.setString(5, e.getRole());
            ps.setBoolean(6, e.isActive());
            ps.setInt(7, e.getId());
            ps.executeUpdate();
        }
    }

    /** Employees are linked to past orders, so they are deactivated instead of deleted. */
    @Override
    public void delete(int id) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("UPDATE employee SET is_active = FALSE WHERE employee_id = ?")) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }

    /** Small functional interface so findOne can accept a lambda that sets parameters. */
    private interface ParamSetter {
        void set(PreparedStatement ps) throws SQLException;
    }

    private Optional<Employee> findOne(String sql, ParamSetter setter) throws SQLException {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setter.set(ps);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    private Employee map(ResultSet rs) throws SQLException {
        return Employee.create(rs.getString("role"), rs.getInt("employee_id"), rs.getString("first_name"),
                rs.getString("last_name"), rs.getString("username"), rs.getString("password_hash"),
                rs.getBoolean("is_active"));
    }
}

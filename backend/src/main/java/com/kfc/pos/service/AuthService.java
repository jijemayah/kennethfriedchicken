package com.kfc.pos.service;

import com.kfc.pos.table.EmployeeTable;
import com.kfc.pos.model.Employee;

import java.security.SecureRandom;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class AuthService {
    private static final long SESSION_SECONDS = 12 * 60 * 60;

    private record Session(int employeeId, Instant expiresAt) { }

    private final EmployeeTable employeeTable;
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public AuthService(EmployeeTable employeeTable) {
        this.employeeTable = employeeTable;
    }

    public Optional<String> login(String username, String password) throws SQLException {
        if (username == null || password == null) {
            return Optional.empty();
        }
        Optional<Employee> found = employeeTable.findByUsername(username);
        if (found.isEmpty() || !found.get().isActive()
                || !PasswordHasher.matches(password, found.get().getPasswordHash())) {
            return Optional.empty();
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.put(token, new Session(found.get().getId(), Instant.now().plusSeconds(SESSION_SECONDS)));
        return Optional.of(token);
    }

    public Optional<Employee> findByToken(String token) throws SQLException {
        Session session = token == null ? null : sessions.get(token);
        if (session == null) {
            return Optional.empty();
        }
        if (session.expiresAt().isBefore(Instant.now())) {
            sessions.remove(token);
            return Optional.empty();
        }
        return employeeTable.findById(session.employeeId()).filter(Employee::isActive);
    }

    public void logout(String token) {
        if (token != null) {
            sessions.remove(token);
        }
    }
}

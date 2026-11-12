package com.kfc.pos.http;

import com.kfc.pos.dao.Database;
import com.kfc.pos.model.Employee;
import com.kfc.pos.service.AuthService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Map;

/**
 * Shared plumbing for every API endpoint: CORS headers, JSON responses,
 * error handling, and login checks. Each subclass only writes handle(Request).
 */
public abstract class BaseHandler implements HttpHandler {

    private static final String ALLOWED_ORIGIN = Database.env("CORS_ORIGIN", "*");

    protected final AuthService auth;

    protected BaseHandler(AuthService auth) {
        this.auth = auth;
    }

    /** Return the object to send as JSON. Return null to send "204 No Content". */
    protected abstract Object handle(Request request) throws Exception;

    @Override
    public final void handle(HttpExchange exchange) throws IOException {
        try {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                send(exchange, 204, null);
                return;
            }
            Request request = new Request(exchange);
            Object result = handle(request);
            send(exchange, result == null ? 204 : request.status(), result);
        } catch (ApiException e) {
            send(exchange, e.getStatus(), error(e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            send(exchange, 400, error(e.getMessage()));          // validation errors from model classes
        } catch (SQLException e) {
            send(exchange, sqlStatus(e), error(sqlMessage(e)));
        } catch (Exception e) {
            e.printStackTrace();
            send(exchange, 500, error("Something went wrong on the server"));
        } finally {
            exchange.close();
        }
    }

    // ---- Login / permission helpers used by subclasses ----

    protected Employee requireLogin(Request request) throws SQLException {
        return auth.findByToken(request.bearerToken())
                .orElseThrow(() -> new ApiException(401, "Please log in again"));
    }

    protected void requirePermission(boolean allowed) {
        if (!allowed) {
            throw new ApiException(403, "Only managers can do this");
        }
    }

    protected ApiException notFound(String what) {
        return new ApiException(404, what + " not found");
    }

    protected ApiException methodNotAllowed() {
        return new ApiException(405, "Method not allowed");
    }

    // ---- Response helpers ----

    private void addCorsHeaders(HttpExchange exchange) {
        var headers = exchange.getResponseHeaders();
        headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
        headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        headers.set("Access-Control-Max-Age", "86400");
    }

    private void send(HttpExchange exchange, int status, Object body) throws IOException {
        if (body == null) {
            exchange.sendResponseHeaders(status, -1);
            return;
        }
        byte[] bytes = Json.stringify(body).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    private Map<String, Object> error(String message) {
        return Map.of("error", message == null ? "Error" : message);
    }

    /** Turns common PostgreSQL error codes into friendly messages. */
    private int sqlStatus(SQLException e) {
        String state = e.getSQLState();
        if ("23505".equals(state) || "23503".equals(state)) {
            return 409;   // conflict
        }
        if ("23514".equals(state)) {
            return 400;
        }
        System.err.println("Database error: " + e.getMessage());
        return 500;
    }

    private String sqlMessage(SQLException e) {
        String state = e.getSQLState();
        if ("23505".equals(state)) {
            return "That name is already used";
        }
        if ("23503".equals(state)) {
            return "This record is still used by other records";
        }
        if ("23514".equals(state)) {
            return "A value is outside the allowed range";
        }
        return "Database error. Please try again.";
    }
}

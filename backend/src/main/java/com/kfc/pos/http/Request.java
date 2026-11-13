package com.kfc.pos.http;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Request {
    private final HttpExchange exchange;
    private final List<String> segments = new ArrayList<>();
    private final Map<String, String> query = new HashMap<>();
    private int status = 200;

    public Request(HttpExchange exchange) {
        this.exchange = exchange;
        String context = exchange.getHttpContext().getPath();
        String rest = exchange.getRequestURI().getPath().substring(context.length());
        for (String part : rest.split("/")) {
            if (!part.isEmpty()) {
                segments.add(part);
            }
        }
        String rawQuery = exchange.getRequestURI().getRawQuery();
        if (rawQuery != null) {
            for (String pair : rawQuery.split("&")) {
                String[] kv = pair.split("=", 2);
                query.put(decode(kv[0]), kv.length > 1 ? decode(kv[1]) : "");
            }
        }
    }

    public String method() {
        return exchange.getRequestMethod().toUpperCase();
    }

    public int segmentCount() {
        return segments.size();
    }

    public String segment(int index) {
        return index < segments.size() ? segments.get(index) : null;
    }

    public int idAt(int index) {
        String value = segment(index);
        if (value == null || !value.matches("\\d{1,9}")) {
            throw new ApiException(400, "Invalid id in URL");
        }
        return Integer.parseInt(value);
    }

    public String query(String name) {
        String value = query.get(name);
        return value == null || value.isBlank() ? null : value.trim();
    }

    public JsonBody body() throws IOException {
        try (InputStream in = exchange.getRequestBody()) {
            String text = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            if (text.isBlank()) {
                throw new ApiException(400, "Request body is required");
            }
            return new JsonBody(Json.parse(text));
        }
    }

    public String bearerToken() {
        String header = exchange.getRequestHeaders().getFirst("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring(7).trim();
    }

    public int status() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    private static String decode(String s) {
        return URLDecoder.decode(s, StandardCharsets.UTF_8);
    }
}

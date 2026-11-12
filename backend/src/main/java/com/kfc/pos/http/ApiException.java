package com.kfc.pos.http;

/** An error with an HTTP status code, e.g. 401 Unauthorized or 404 Not Found. */
public class ApiException extends RuntimeException {

    private final int status;

    public ApiException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}

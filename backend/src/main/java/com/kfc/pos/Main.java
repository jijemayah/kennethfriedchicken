package com.kfc.pos;

import com.kfc.pos.dao.CategoryDao;
import com.kfc.pos.dao.CustomerDao;
import com.kfc.pos.dao.DashboardDao;
import com.kfc.pos.dao.Database;
import com.kfc.pos.dao.EmployeeDao;
import com.kfc.pos.dao.InventoryDao;
import com.kfc.pos.dao.OrderDao;
import com.kfc.pos.dao.ProductDao;
import com.kfc.pos.http.AuthHandler;
import com.kfc.pos.http.CategoryHandler;
import com.kfc.pos.http.EmployeeHandler;
import com.kfc.pos.http.InventoryHandler;
import com.kfc.pos.http.OrderHandler;
import com.kfc.pos.http.ProductHandler;
import com.kfc.pos.http.SimpleHandlers;
import com.kfc.pos.service.AuthService;
import com.kfc.pos.service.CheckoutService;
import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

/**
 * Starts the REST API using Java's built-in HTTP server (no framework).
 * Wiring is done by hand here: create the DAOs, the services, then the handlers.
 */
public class Main {

    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(Database.env("PORT", "8080"));

        EmployeeDao employeeDao = new EmployeeDao();
        ProductDao productDao = new ProductDao();
        InventoryDao inventoryDao = new InventoryDao();
        OrderDao orderDao = new OrderDao();

        AuthService auth = new AuthService(employeeDao);
        CheckoutService checkout = new CheckoutService(orderDao, inventoryDao);

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/health", new SimpleHandlers.Health(auth));
        server.createContext("/api/auth", new AuthHandler(auth));
        server.createContext("/api/dashboard", new SimpleHandlers.Dashboard(auth, new DashboardDao()));
        server.createContext("/api/categories", new CategoryHandler(auth, new CategoryDao()));
        server.createContext("/api/products", new ProductHandler(auth, productDao));
        server.createContext("/api/inventory", new InventoryHandler(auth, inventoryDao));
        server.createContext("/api/orders", new OrderHandler(auth, orderDao, checkout));
        server.createContext("/api/employees", new EmployeeHandler(auth, employeeDao));
        server.createContext("/api/customers", new SimpleHandlers.Customers(auth, new CustomerDao()));

        // Java 21 virtual threads: each request gets its own lightweight thread.
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        server.start();
        System.out.println("KFC POS API running on http://localhost:" + port);
    }
}

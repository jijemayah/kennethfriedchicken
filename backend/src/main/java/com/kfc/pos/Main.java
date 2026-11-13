package com.kfc.pos;

import com.kfc.pos.table.CategoryTable;
import com.kfc.pos.table.CustomerTable;
import com.kfc.pos.table.DashboardTable;
import com.kfc.pos.table.Database;
import com.kfc.pos.table.EmployeeTable;
import com.kfc.pos.table.InventoryTable;
import com.kfc.pos.table.OrderTable;
import com.kfc.pos.table.ProductTable;
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

public class Main {

    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(Database.env("PORT", "8080"));

        EmployeeTable employeeTable = new EmployeeTable();
        ProductTable productTable = new ProductTable();
        InventoryTable inventoryTable = new InventoryTable();
        OrderTable orderTable = new OrderTable();

        AuthService auth = new AuthService(employeeTable);
        CheckoutService checkout = new CheckoutService(orderTable, inventoryTable);

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/health", new SimpleHandlers.Health(auth));
        server.createContext("/api/auth", new AuthHandler(auth));
        server.createContext("/api/dashboard", new SimpleHandlers.Dashboard(auth, new DashboardTable()));
        server.createContext("/api/categories", new CategoryHandler(auth, new CategoryTable()));
        server.createContext("/api/products", new ProductHandler(auth, productTable));
        server.createContext("/api/inventory", new InventoryHandler(auth, inventoryTable));
        server.createContext("/api/orders", new OrderHandler(auth, orderTable, checkout));
        server.createContext("/api/employees", new EmployeeHandler(auth, employeeTable));
        server.createContext("/api/customers", new SimpleHandlers.Customers(auth, new CustomerTable()));
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        server.start();
        System.out.println("KFC POS API running on http://localhost:" + port);
    }
}

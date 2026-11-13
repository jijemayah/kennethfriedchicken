package com.kfc.pos.http;

import com.kfc.pos.model.Category;
import com.kfc.pos.model.Customer;
import com.kfc.pos.model.Employee;
import com.kfc.pos.model.InventoryItem;
import com.kfc.pos.model.Order;
import com.kfc.pos.model.OrderItem;
import com.kfc.pos.model.Product;
import com.kfc.pos.payment.PaymentRecord;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class JsonMapper {

    private JsonMapper() { }

    public static Map<String, Object> employee(Employee e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("firstName", e.getFirstName());
        m.put("lastName", e.getLastName());
        m.put("fullName", e.getFullName());
        m.put("username", e.getUsername());
        m.put("role", e.getRole());
        m.put("active", e.isActive());
        m.put("canManageProducts", e.canManageProducts());
        m.put("canManageInventory", e.canManageInventory());
        m.put("canManageEmployees", e.canManageEmployees());
        m.put("canProcessSales", e.canProcessSales());
        return m;                  
    }

    public static Map<String, Object> category(Category c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("description", c.getDescription());
        m.put("productCount", c.getProductCount());
        return m;
    }

    public static Map<String, Object> product(Product p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("categoryId", p.getCategoryId());
        m.put("categoryName", p.getCategoryName());
        m.put("name", p.getName());
        m.put("description", p.getDescription());
        m.put("price", p.getPrice());
        m.put("imageUrl", p.getImageUrl());
        m.put("active", p.isActive());
        m.put("stock", p.getStockQuantity());
        m.put("available", p.isAvailable());
        return m;
    }

    public static Map<String, Object> inventory(InventoryItem i) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("productId", i.getProductId());
        m.put("productName", i.getProductName());
        m.put("categoryName", i.getCategoryName());
        m.put("quantity", i.getQuantity());
        m.put("reorderLevel", i.getReorderLevel());
        m.put("lowStock", i.isLowStock());
        m.put("updatedAt", i.getUpdatedAt());
        return m;
    }

    public static Map<String, Object> customer(Customer c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("fullName", c.getFullName());
        m.put("phone", c.getPhone());
        m.put("email", c.getEmail());
        return m;
    }

    public static Map<String, Object> order(Order o, Integer itemCount) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", o.getId());
        m.put("receiptNumber", o.getReceiptNumber());
        m.put("employeeId", o.getEmployeeId());
        m.put("employeeName", o.getEmployeeName());
        m.put("customerId", o.getCustomerId());
        m.put("customerName", o.getCustomerName());
        m.put("subtotal", o.getSubtotal());
        m.put("vat", o.getVat());
        m.put("total", o.getTotal());
        m.put("status", o.getStatus());
        m.put("createdAt", o.getCreatedAt());
        m.put("itemCount", itemCount != null ? itemCount : o.getTotalQuantity());
        m.put("payment", o.getPayment() == null ? null : payment(o.getPayment()));
        if (!o.getItems().isEmpty()) {
            List<Map<String, Object>> items = new ArrayList<>();
            for (OrderItem item : o.getItems()) {
                items.add(orderItem(item));
            }
            m.put("items", items);
        }
        return m;
    }

    private static Map<String, Object> orderItem(OrderItem i) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("productId", i.getProductId());
        m.put("productName", i.getProductName());
        m.put("quantity", i.getQuantity());
        m.put("unitPrice", i.getUnitPrice());
        m.put("lineTotal", i.getLineTotal());
        return m;
    }

    private static Map<String, Object> payment(PaymentRecord p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("method", p.getMethod());
        m.put("amountDue", p.getAmountDue());
        m.put("amountTendered", p.getAmountTendered());
        m.put("change", p.getChange());
        m.put("referenceNumber", p.getReferenceNumber());
        m.put("details", p.getDetails());
        m.put("paidAt", p.getPaidAt());
        return m;
    }

    public static <T> List<Map<String, Object>> list(List<T> items,
                                                     java.util.function.Function<T, Map<String, Object>> mapper) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (T item : items) {
            result.add(mapper.apply(item));
        }
        return result;
    }
}

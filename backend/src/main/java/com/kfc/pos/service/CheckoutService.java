package com.kfc.pos.service;

import com.kfc.pos.discount.Discount;
import com.kfc.pos.model.Customer;
import com.kfc.pos.model.Employee;
import com.kfc.pos.model.InventoryItem;
import com.kfc.pos.model.Order;
import com.kfc.pos.model.OrderItem;
import com.kfc.pos.model.OrderType;
import com.kfc.pos.payment.Payment;
import com.kfc.pos.table.CustomerTable;
import com.kfc.pos.table.Database;
import com.kfc.pos.table.InventoryTable;
import com.kfc.pos.table.OrderTable;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public class CheckoutService {
    public record CartLine(int productId, int quantity) { }

    public record PaymentInput(String method, BigDecimal amountTendered, String mobileNumber,
                               String cardNumber, String cardHolder) { }

    public record CheckoutRequest(String customerName, String orderType, String discountType,
                                  String discountIdNo, List<CartLine> cart, PaymentInput payment) { }

    private final OrderTable orderTable;
    private final InventoryTable inventoryTable;
    private final CustomerTable customerTable;

    public CheckoutService(OrderTable orderTable, InventoryTable inventoryTable, CustomerTable customerTable) {
        this.orderTable = orderTable;
        this.inventoryTable = inventoryTable;
        this.customerTable = customerTable;
    }

    public int checkout(Employee cashier, CheckoutRequest request) throws SQLException {
        if (!cashier.canProcessSales()) {
            throw new IllegalArgumentException("This account cannot process sales");
        }
        List<CartLine> cart = request.cart();
        if (cart == null || cart.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }
        OrderType type = OrderType.parse(request.orderType());
        Discount discount = Discount.create(request.discountType(), request.discountIdNo());
        boolean hasName = request.customerName() != null && !request.customerName().isBlank();
        if (type.needsCustomerName() && !hasName) {
            throw new IllegalArgumentException("Enter the customer name for " + type.getLabel().toLowerCase() + " orders");
        }
        if (discount.isVatExempt() && !hasName) {
            throw new IllegalArgumentException("Enter the customer name for senior citizen / PWD discounts");
        }

        try (Connection conn = Database.getConnection()) {
            conn.setAutoCommit(false);
            try {
                if ("EMPLOYEE".equals(discount.getType())) {
                    requireActiveEmployee(conn, discount.getIdNumber());
                }
                Integer customerId = null;
                String customerName = null;
                if (hasName) {
                    Customer customer = customerTable.findOrCreateByName(conn, request.customerName());
                    customerId = customer.getId();
                    customerName = customer.getFullName();
                }

                Order order = new Order(cashier.getId(), customerId, type, discount);
                order.setCustomer(customerId, customerName);
                for (CartLine line : cart) {
                    if (line.quantity() <= 0) {
                        throw new IllegalArgumentException("Quantity must be at least 1");
                    }
                    SellableProduct product = findSellableProduct(conn, line.productId());
                    if (type == OrderType.DRIVE_THRU && !product.driveThru()) {
                        throw new IllegalArgumentException(product.name() + " is not available at the drive-thru");
                    }
                    order.addItem(new OrderItem(line.productId(), product.name(), product.price(), line.quantity()));
                }

                PaymentInput input = request.payment();
                Payment payment = Payment.create(input.method(), order.getTotal(), input.amountTendered(),
                        input.mobileNumber(), input.cardNumber(), input.cardHolder());
                payment.process();

                int orderId = orderTable.insert(conn, order, payment);
                for (OrderItem item : order.getItems()) {
                    InventoryItem stock = inventoryTable.findByProductId(conn, item.getProductId(), true)
                            .orElseThrow(() -> new IllegalArgumentException(
                                    item.getProductName() + " has no inventory record"));
                    stock.removeStock(item.getQuantity());
                    inventoryTable.save(conn, stock);
                }

                conn.commit();
                return orderId;
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    /**
     * Void: money goes back and the items go back to inventory.
     * Refund: money goes back but the stock stays deducted (food was already served).
     */
    public Order cancel(Employee user, int orderId, String action, String reason) throws SQLException {
        try (Connection conn = Database.getConnection()) {
            conn.setAutoCommit(false);
            try {
                Order order = orderTable.findById(conn, orderId, true)
                        .orElseThrow(() -> new IllegalArgumentException("Order not found"));
                boolean isVoid = "void".equals(action);
                if (isVoid) {
                    order.voidOrder(user, reason);
                    for (OrderItem item : order.getItems()) {
                        Optional<InventoryItem> stock = inventoryTable.findByProductId(conn, item.getProductId(), true);
                        if (stock.isPresent()) {
                            stock.get().addStock(item.getQuantity());
                            inventoryTable.save(conn, stock.get());
                        }
                    }
                } else {
                    order.refund(user, reason);
                }
                orderTable.saveCancellation(conn, order, user.getId());
                conn.commit();
                return order;
            } catch (SQLException | RuntimeException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    private void requireActiveEmployee(Connection conn, String employeeNo) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT is_active FROM employee WHERE employee_no = ?")) {
            ps.setString(1, employeeNo);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    throw new IllegalArgumentException("No employee has number " + employeeNo);
                }
                if (!rs.getBoolean(1)) {
                    throw new IllegalArgumentException(employeeNo + " is not an active employee");
                }
            }
        }
    }

    private record SellableProduct(String name, BigDecimal price, boolean driveThru) { }

    private SellableProduct findSellableProduct(Connection conn, int productId) throws SQLException {
        String sql = "SELECT p.name, p.price, p.is_active, c.drive_thru FROM product p "
                + "JOIN category c ON c.category_id = p.category_id WHERE p.product_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, productId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    throw new IllegalArgumentException("Product " + productId + " does not exist");
                }
                if (!rs.getBoolean("is_active")) {
                    throw new IllegalArgumentException(rs.getString("name") + " is no longer available");
                }
                return new SellableProduct(rs.getString("name"), rs.getBigDecimal("price"),
                        rs.getBoolean("drive_thru"));
            }
        }
    }
}

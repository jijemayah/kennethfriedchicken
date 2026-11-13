package com.kfc.pos.service;

import com.kfc.pos.table.Database;
import com.kfc.pos.table.InventoryTable;
import com.kfc.pos.table.OrderTable;
import com.kfc.pos.model.Employee;
import com.kfc.pos.model.InventoryItem;
import com.kfc.pos.model.Order;
import com.kfc.pos.model.OrderItem;
import com.kfc.pos.payment.Payment;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

public class CheckoutService {

    public record CartLine(int productId, int quantity) { }

    public record PaymentInput(String method, BigDecimal amountTendered, String mobileNumber,
                               String cardNumber, String cardHolder) { }

    private final OrderTable orderTable;
    private final InventoryTable inventoryTable;

    public CheckoutService(OrderTable orderTable, InventoryTable inventoryTable) {
        this.orderTable = orderTable;
        this.inventoryTable = inventoryTable;
    }

    public int checkout(Employee cashier, Integer customerId, List<CartLine> cart, PaymentInput input)
            throws SQLException {
        if (!cashier.canProcessSales()) {
            throw new IllegalArgumentException("This account cannot process sales");
        }
        if (cart == null || cart.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        try (Connection conn = Database.getConnection()) {
            conn.setAutoCommit(false);
            try {
                Order order = new Order(cashier.getId(), customerId);

                for (CartLine line : cart) {
                    if (line.quantity() <= 0) {
                        throw new IllegalArgumentException("Quantity must be at least 1");
                    }
                    ProductPrice product = findSellableProduct(conn, line.productId());
                    order.addItem(new OrderItem(line.productId(), product.name(), product.price(), line.quantity()));
                }

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

    private record ProductPrice(String name, BigDecimal price) { }

    private ProductPrice findSellableProduct(Connection conn, int productId) throws SQLException {
        String sql = "SELECT name, price, is_active FROM product WHERE product_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, productId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    throw new IllegalArgumentException("Product " + productId + " does not exist");
                }
                if (!rs.getBoolean("is_active")) {
                    throw new IllegalArgumentException(rs.getString("name") + " is no longer available");
                }
                return new ProductPrice(rs.getString("name"), rs.getBigDecimal("price"));
            }
        }
    }
}

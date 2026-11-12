package com.kfc.pos.service;

import com.kfc.pos.dao.Database;
import com.kfc.pos.dao.InventoryDao;
import com.kfc.pos.dao.OrderDao;
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

/**
 * Checkout = one database TRANSACTION.
 *
 *   1. lock and read the stock of every product in the cart
 *   2. build the Order (prices come from the database, not the browser)
 *   3. process the Payment (cash / GCash / card — polymorphism)
 *   4. save order + items + payment and reduce inventory
 *
 * If ANY step fails, rollback() undoes everything, so we never get an
 * order without a payment or stock that was reduced for a failed sale.
 */
public class CheckoutService {

    /** What the cashier sent: product id + quantity. */
    public record CartLine(int productId, int quantity) { }

    /** Payment fields from the checkout form. Only the ones for the chosen method are used. */
    public record PaymentInput(String method, BigDecimal amountTendered, String mobileNumber,
                               String cardNumber, String cardHolder) { }

    private final OrderDao orderDao;
    private final InventoryDao inventoryDao;

    public CheckoutService(OrderDao orderDao, InventoryDao inventoryDao) {
        this.orderDao = orderDao;
        this.inventoryDao = inventoryDao;
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

                // Steps 1 + 2: check stock and use the real price from the database.
                for (CartLine line : cart) {
                    if (line.quantity() <= 0) {
                        throw new IllegalArgumentException("Quantity must be at least 1");
                    }
                    ProductPrice product = findSellableProduct(conn, line.productId());
                    order.addItem(new OrderItem(line.productId(), product.name(), product.price(), line.quantity()));
                }

                // Step 3: the checkout code does not care which subclass this is.
                Payment payment = Payment.create(input.method(), order.getTotal(), input.amountTendered(),
                        input.mobileNumber(), input.cardNumber(), input.cardHolder());
                payment.process();

                // Step 4: save everything and reduce stock.
                int orderId = orderDao.insert(conn, order, payment);
                for (OrderItem item : order.getItems()) {
                    InventoryItem stock = inventoryDao.findByProductId(conn, item.getProductId(), true)
                            .orElseThrow(() -> new IllegalArgumentException(
                                    item.getProductName() + " has no inventory record"));
                    stock.removeStock(item.getQuantity());   // throws if not enough stock
                    inventoryDao.save(conn, stock);
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

package com.kfc.pos.model;

import com.kfc.pos.payment.PaymentRecord;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * ENCAPSULATION example used at checkout.
 *
 * - The item list is private; outside code gets a read-only copy.
 * - subtotal, VAT, and total have NO setters. They are recalculated
 *   every time an item is added, so they can never be out of sync.
 */
public class Order {

    public static final BigDecimal VAT_RATE = new BigDecimal("0.12");

    private int id;
    private int employeeId;
    private String employeeName;
    private Integer customerId;      // null = walk-in customer
    private String customerName;
    private String status = "COMPLETED";
    private OffsetDateTime createdAt;
    private final List<OrderItem> items = new ArrayList<>();
    private PaymentRecord payment;   // filled in when loading a saved order

    private BigDecimal subtotal = BigDecimal.ZERO.setScale(2);
    private BigDecimal vat = BigDecimal.ZERO.setScale(2);
    private BigDecimal total = BigDecimal.ZERO.setScale(2);

    /** Used when building a brand-new order at the POS. */
    public Order(int employeeId, Integer customerId) {
        this.employeeId = employeeId;
        this.customerId = customerId;
    }

    /** Used when loading a saved order from the database. */
    public Order(int id, int employeeId, String employeeName, Integer customerId, String customerName,
                 BigDecimal subtotal, BigDecimal vat, BigDecimal total, String status,
                 OffsetDateTime createdAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.customerId = customerId;
        this.customerName = customerName;
        this.subtotal = subtotal;
        this.vat = vat;
        this.total = total;
        this.status = status;
        this.createdAt = createdAt;
    }

    /** Adds an item; the same product added twice is merged into one line. */
    public void addItem(OrderItem newItem) {
        for (OrderItem item : items) {
            if (item.getProductId() == newItem.getProductId()) {
                item.setQuantity(item.getQuantity() + newItem.getQuantity());
                recalculateTotals();
                return;
            }
        }
        items.add(newItem);
        recalculateTotals();
    }

    /** Items loaded from the database already match the saved totals. */
    public void loadItem(OrderItem item) {
        items.add(item);
    }

    private void recalculateTotals() {
        BigDecimal sum = BigDecimal.ZERO;
        for (OrderItem item : items) {
            sum = sum.add(item.getLineTotal());
        }
        subtotal = sum.setScale(2, RoundingMode.HALF_UP);
        vat = subtotal.multiply(VAT_RATE).setScale(2, RoundingMode.HALF_UP);
        total = subtotal.add(vat);
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public int getTotalQuantity() {
        int count = 0;
        for (OrderItem item : items) {
            count += item.getQuantity();
        }
        return count;
    }

    public List<OrderItem> getItems() { return Collections.unmodifiableList(items); }

    public int getId() { return id; }

    public void setId(int id) { this.id = id; }

    /** Receipt number shown to customers, e.g. OR-000123. */
    public String getReceiptNumber() { return String.format("OR-%06d", id); }

    public int getEmployeeId() { return employeeId; }

    public String getEmployeeName() { return employeeName; }

    public Integer getCustomerId() { return customerId; }

    public String getCustomerName() { return customerName; }

    public String getStatus() { return status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }

    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public BigDecimal getSubtotal() { return subtotal; }

    public BigDecimal getVat() { return vat; }

    public BigDecimal getTotal() { return total; }

    public PaymentRecord getPayment() { return payment; }

    public void setPayment(PaymentRecord payment) { this.payment = payment; }
}

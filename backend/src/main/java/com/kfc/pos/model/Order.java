package com.kfc.pos.model;

import com.kfc.pos.discount.Discount;
import com.kfc.pos.discount.NoDiscount;
import com.kfc.pos.payment.PaymentRecord;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Order {
    public static final BigDecimal VAT_RATE = new BigDecimal("0.12");
    public static final ZoneId STORE_ZONE = ZoneId.of("Asia/Manila");

    private int id;
    private final int employeeId;
    private String employeeName;
    private String employeeNo;
    private Integer customerId;
    private String customerName;
    private final OrderType orderType;
    private final Discount discount;
    private final String discountType;
    private final String discountIdNo;
    private String status = "COMPLETED";
    private OrderStatus orderStatus = OrderStatus.PREPARING;
    private OffsetDateTime createdAt;
    private OffsetDateTime cancelledAt;
    private String cancelledByName;
    private String cancelReason;
    private final List<OrderItem> items = new ArrayList<>();
    private PaymentRecord payment;

    private BigDecimal subtotal = BigDecimal.ZERO.setScale(2);
    private BigDecimal discountAmount = BigDecimal.ZERO.setScale(2);
    private BigDecimal vat = BigDecimal.ZERO.setScale(2);
    private BigDecimal total = BigDecimal.ZERO.setScale(2);

    /** A new order being rung up at the POS. */
    public Order(int employeeId, Integer customerId, OrderType orderType, Discount discount) {
        this.employeeId = employeeId;
        this.customerId = customerId;
        this.orderType = orderType == null ? OrderType.DINE_IN : orderType;
        this.discount = discount == null ? new NoDiscount() : discount;
        this.discountType = this.discount.getType();
        this.discountIdNo = this.discount.getIdNumber();
    }

    /** An order loaded from the database. The totals are the amounts that were charged. */
    public Order(int id, int employeeId, String employeeName, Integer customerId, String customerName,
                 OrderType orderType, String discountType, String discountIdNo,
                 BigDecimal subtotal, BigDecimal discountAmount, BigDecimal vat, BigDecimal total,
                 String status, OffsetDateTime createdAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.customerId = customerId;
        this.customerName = customerName;
        this.orderType = orderType;
        this.discount = null;
        this.discountType = discountType;
        this.discountIdNo = discountIdNo;
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.vat = vat;
        this.total = total;
        this.status = status;
        this.createdAt = createdAt;
    }

    public void addItem(OrderItem newItem) {
        if (discount == null) {
            throw new IllegalStateException("Saved orders cannot be changed");
        }
        boolean merged = false;
        for (OrderItem item : items) {
            if (item.getProductId() == newItem.getProductId()) {
                item.setQuantity(item.getQuantity() + newItem.getQuantity());
                merged = true;
            }
        }
        if (!merged) {
            items.add(newItem);
        }
        recalculateTotals();
    }

    public void loadItem(OrderItem item) {
        items.add(item);
    }

    private void recalculateTotals() {
        discount.apply(items);
        BigDecimal sum = BigDecimal.ZERO.setScale(2);
        BigDecimal off = BigDecimal.ZERO.setScale(2);
        BigDecimal tax = BigDecimal.ZERO.setScale(2);
        for (OrderItem item : items) {
            sum = sum.add(item.getLineTotal());
            off = off.add(item.getDiscount());
            tax = tax.add(item.getVat());
        }
        subtotal = sum;
        discountAmount = off;
        vat = tax;
        total = subtotal.subtract(discountAmount).add(vat);
    }

    public void voidOrder(Employee by, String reason) {
        cancel("VOIDED", by, reason);
    }

    public void refund(Employee by, String reason) {
        cancel("REFUNDED", by, reason);
    }

    private void cancel(String newStatus, Employee by, String reason) {
        if (!isCompleted()) {
            throw new IllegalStateException("This order is already " + status.toLowerCase());
        }
        if (!by.canModifyOrder(this)) {
            throw new IllegalStateException("Cashiers can only void or refund today's orders");
        }
        this.cancelReason = Validator.requireText(reason, "Reason", 200);
        this.status = newStatus;
        this.cancelledByName = by.getFullName();
        this.cancelledAt = OffsetDateTime.now();
    }

    public void changeOrderStatus(OrderStatus newStatus, Employee by) {
        if (!isCompleted()) {
            throw new IllegalStateException("A " + status.toLowerCase() + " order cannot change status");
        }
        if (!by.canUpdateOrderStatus(this)) {
            throw new IllegalStateException("Cashiers can only update today's orders");
        }
        if (!newStatus.isAllowedFor(orderType)) {
            throw new IllegalArgumentException(newStatus.getLabel() + " is only for delivery orders");
        }
        this.orderStatus = newStatus;
    }

    public void loadOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public OrderStatus getOrderStatus() { return orderStatus; }

    public OrderStatus getNextOrderStatus() {
        return isCompleted() ? orderStatus.next(orderType) : null;
    }

    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }

    public boolean isVatExempt() {
        return "SENIOR".equals(discountType) || "PWD".equals(discountType);
    }

    public LocalDate getStoreDate() {
        return createdAt == null ? storeToday() : createdAt.atZoneSameInstant(STORE_ZONE).toLocalDate();
    }

    public static LocalDate storeToday() {
        return LocalDate.now(STORE_ZONE);
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

    public String getReceiptNumber() { return String.format("OR-%06d", id); }

    public int getEmployeeId() { return employeeId; }

    public String getEmployeeName() { return employeeName; }

    public String getEmployeeNo() { return employeeNo; }

    public void setEmployeeNo(String employeeNo) { this.employeeNo = employeeNo; }

    public Integer getCustomerId() { return customerId; }

    public void setCustomer(Integer customerId, String customerName) {
        this.customerId = customerId;
        this.customerName = customerName;
    }

    public String getCustomerName() { return customerName; }

    public OrderType getOrderType() { return orderType; }

    public String getDiscountType() { return discountType; }

    public String getDiscountIdNo() { return discountIdNo; }

    public String getStatus() { return status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }

    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getCancelledAt() { return cancelledAt; }

    public String getCancelledByName() { return cancelledByName; }

    public String getCancelReason() { return cancelReason; }

    /** Used when loading a voided or refunded order from the database. */
    public void loadCancellation(OffsetDateTime at, String byName, String reason) {
        this.cancelledAt = at;
        this.cancelledByName = byName;
        this.cancelReason = reason;
    }

    public BigDecimal getSubtotal() { return subtotal; }

    public BigDecimal getDiscountAmount() { return discountAmount; }

    public BigDecimal getVat() { return vat; }

    public BigDecimal getTotal() { return total; }

    /** Sales that VAT was charged on (after discount). Zero for senior/PWD orders. */
    public BigDecimal getVatableSales() {
        return isVatExempt() ? BigDecimal.ZERO.setScale(2) : subtotal.subtract(discountAmount);
    }

    public BigDecimal getVatExemptSales() {
        return isVatExempt() ? subtotal.subtract(discountAmount) : BigDecimal.ZERO.setScale(2);
    }

    public PaymentRecord getPayment() { return payment; }

    public void setPayment(PaymentRecord payment) { this.payment = payment; }
}

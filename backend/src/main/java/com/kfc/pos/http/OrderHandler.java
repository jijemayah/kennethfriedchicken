package com.kfc.pos.http;

import com.kfc.pos.model.Employee;
import com.kfc.pos.model.Order;
import com.kfc.pos.model.OrderStatus;
import com.kfc.pos.service.AuthService;
import com.kfc.pos.service.CheckoutService;
import com.kfc.pos.service.CheckoutService.CartLine;
import com.kfc.pos.service.CheckoutService.CheckoutRequest;
import com.kfc.pos.service.CheckoutService.PaymentInput;
import com.kfc.pos.table.OrderTable;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

public class OrderHandler extends BaseHandler {
    private final OrderTable orderTable;
    private final CheckoutService checkoutService;

    public OrderHandler(AuthService auth, OrderTable orderTable, CheckoutService checkoutService) {
        super(auth);
        this.orderTable = orderTable;
        this.checkoutService = checkoutService;
    }

    @Override
    protected Object handle(Request req) throws Exception {
        Employee user = requireLogin(req);

        if (req.segmentCount() == 0 && req.method().equals("GET")) {
            String method = req.query("method");
            if (method != null && !method.matches("CASH|GCASH|CARD")) {
                throw new ApiException(400, "Unknown payment method");
            }
            String status = req.query("status");
            if (status != null && !status.matches("COMPLETED|VOIDED|REFUNDED")) {
                throw new ApiException(400, "Unknown order status");
            }
            LocalDate from = date(req.query("from"));
            LocalDate to = date(req.query("to"));
            if (!user.canViewSalesHistory()) {
                // Cashiers only ever see today's orders (store time, UTC+8).
                from = Order.storeToday();
                to = Order.storeToday();
            }
            List<OrderTable.OrderSummary> orders = orderTable.search(from, to, method, status, req.query("q"));
            return JsonMapper.list(orders, s -> JsonMapper.order(s.order(), s.itemCount(), user));
        }

        if (req.segmentCount() == 0 && req.method().equals("POST")) {
            JsonBody body = req.body();
            List<CartLine> cart = new ArrayList<>();
            for (JsonBody item : body.getObjects("items")) {
                cart.add(new CartLine(item.getInt("productId", 0), item.getInt("quantity", 0)));
            }
            JsonBody pay = body.getObject("payment");
            if (pay == null) {
                throw new ApiException(400, "Payment details are required");
            }
            PaymentInput payment = new PaymentInput(pay.getString("method"), pay.getDecimal("amountTendered"),
                    pay.getString("mobileNumber"), pay.getString("cardNumber"), pay.getString("cardHolder"));
            JsonBody discount = body.getObject("discount");
            CheckoutRequest request = new CheckoutRequest(body.getString("customerName"),
                    body.getString("orderType"),
                    discount == null ? null : discount.getString("type"),
                    discount == null ? null : discount.getString("idNumber"),
                    cart, payment);

            int orderId = checkoutService.checkout(user, request);
            req.setStatus(201);
            return JsonMapper.order(orderTable.findById(orderId).orElseThrow(), null, user);
        }

        int id = req.idAt(0);
        Order existing = orderTable.findById(id).orElseThrow(() -> notFound("Order"));
        if (!user.canViewOrder(existing)) {
            throw new ApiException(403, "Cashiers can only open today's orders");
        }

        if (req.segmentCount() == 1 && req.method().equals("GET")) {
            return JsonMapper.order(existing, null, user);
        }

        String action = req.segment(1);
        if (req.segmentCount() == 2 && req.method().equals("POST") && action.equals("status")) {
            existing.changeOrderStatus(OrderStatus.parse(req.body().getString("status")), user);
            orderTable.saveOrderStatus(existing);
            return JsonMapper.order(existing, null, user);
        }
        if (req.segmentCount() == 2 && req.method().equals("POST") && action.matches("void|refund")) {
            checkoutService.cancel(user, id, action, req.body().getString("reason"));
            return JsonMapper.order(orderTable.findById(id).orElseThrow(), null, user);
        }
        throw methodNotAllowed();
    }

    private LocalDate date(String value) {
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new ApiException(400, "Dates must look like 2026-11-13");
        }
    }
}

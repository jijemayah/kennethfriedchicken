package com.kfc.pos.http;

import com.kfc.pos.table.OrderTable;
import com.kfc.pos.service.AuthService;
import com.kfc.pos.service.CheckoutService;
import com.kfc.pos.service.CheckoutService.CartLine;
import com.kfc.pos.service.CheckoutService.PaymentInput;
import com.kfc.pos.model.Employee;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * GET  /api/orders?from=2026-11-01&to=2026-11-13&method=CASH&q=euwan
 * GET  /api/orders/{id}
 * POST /api/orders     checkout
 */
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
            List<OrderTable.OrderSummary> orders = orderTable.search(date(req.query("from")),
                    date(req.query("to")), method, req.query("q"));
            return JsonMapper.list(orders, s -> JsonMapper.order(s.order(), s.itemCount()));
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

            int orderId = checkoutService.checkout(user, body.getInt("customerId"), cart, payment);
            req.setStatus(201);
            return JsonMapper.order(orderTable.findById(orderId).orElseThrow(), null);
        }

        if (req.segmentCount() == 1 && req.method().equals("GET")) {
            return JsonMapper.order(orderTable.findById(req.idAt(0)).orElseThrow(() -> notFound("Order")), null);
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

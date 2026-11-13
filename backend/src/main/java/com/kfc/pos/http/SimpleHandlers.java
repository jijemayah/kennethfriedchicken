package com.kfc.pos.http;

import com.kfc.pos.table.CustomerTable;
import com.kfc.pos.table.DashboardTable;
import com.kfc.pos.model.Customer;
import com.kfc.pos.service.AuthService;

import java.util.Map;

public final class SimpleHandlers {

    private SimpleHandlers() { }

    public static class Dashboard extends BaseHandler {
        private final DashboardTable table;

        public Dashboard(AuthService auth, DashboardTable table) {
            super(auth);
            this.table = table;
        }

        @Override
        protected Object handle(Request req) throws Exception {
            requireLogin(req);
            return table.summary();
        }
    }

    public static class Customers extends BaseHandler {
        private final CustomerTable table;

        public Customers(AuthService auth, CustomerTable table) {
            super(auth);
            this.table = table;
        }

        @Override
        protected Object handle(Request req) throws Exception {
            requireLogin(req);
            if (req.method().equals("GET")) {
                return JsonMapper.list(table.findAll(), JsonMapper::customer);
            }
            if (req.method().equals("POST")) {
                JsonBody body = req.body();
                Customer created = table.create(new Customer(0, body.getString("fullName"),
                        body.getString("phone"), body.getString("email")));
                req.setStatus(201);
                return JsonMapper.customer(created);
            }
            throw methodNotAllowed();
        }
    }

    public static class Health extends BaseHandler {
        public Health(AuthService auth) {
            super(auth);
        }

        @Override
        protected Object handle(Request req) {
            return Map.of("status", "ok");
        }
    }
}

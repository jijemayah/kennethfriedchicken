package com.kfc.pos.http;

import com.kfc.pos.dao.CustomerDao;
import com.kfc.pos.dao.DashboardDao;
import com.kfc.pos.model.Customer;
import com.kfc.pos.service.AuthService;

import java.util.Map;

/** Small read-mostly endpoints grouped together. */
public final class SimpleHandlers {

    private SimpleHandlers() { }

    /** GET /api/dashboard */
    public static class Dashboard extends BaseHandler {
        private final DashboardDao dao;

        public Dashboard(AuthService auth, DashboardDao dao) {
            super(auth);
            this.dao = dao;
        }

        @Override
        protected Object handle(Request req) throws Exception {
            requireLogin(req);
            return dao.summary();
        }
    }

    /** GET /api/customers, POST /api/customers */
    public static class Customers extends BaseHandler {
        private final CustomerDao dao;

        public Customers(AuthService auth, CustomerDao dao) {
            super(auth);
            this.dao = dao;
        }

        @Override
        protected Object handle(Request req) throws Exception {
            requireLogin(req);
            if (req.method().equals("GET")) {
                return JsonMapper.list(dao.findAll(), JsonMapper::customer);
            }
            if (req.method().equals("POST")) {
                JsonBody body = req.body();
                Customer created = dao.create(new Customer(0, body.getString("fullName"),
                        body.getString("phone"), body.getString("email")));
                req.setStatus(201);
                return JsonMapper.customer(created);
            }
            throw methodNotAllowed();
        }
    }

    /** GET /api/health — used by Render to check the server is up. */
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

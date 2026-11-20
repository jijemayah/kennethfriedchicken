package com.kfc.pos.http;

import com.kfc.pos.table.CustomerTable;
import com.kfc.pos.table.DashboardTable;
import com.kfc.pos.table.ReportTable;
import com.kfc.pos.model.Customer;
import com.kfc.pos.model.Employee;
import com.kfc.pos.model.Order;
import com.kfc.pos.service.AuthService;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
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
            Employee user = requireLogin(req);
            return user.canViewSalesHistory() ? table.managerSummary() : table.cashierSummary(user.getId());
        }
    }

    /** GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD. Cashiers can only get today's (daily) report. */
    public static class Reports extends BaseHandler {
        private final ReportTable table;

        public Reports(AuthService auth, ReportTable table) {
            super(auth);
            this.table = table;
        }

        @Override
        protected Object handle(Request req) throws Exception {
            Employee user = requireLogin(req);
            if (!req.method().equals("GET") || !"sales".equals(req.segment(0))) {
                throw methodNotAllowed();
            }
            LocalDate today = Order.storeToday();
            LocalDate from = date(req.query("from"), today);
            LocalDate to = date(req.query("to"), from);
            if (!user.canViewSalesHistory() && (!from.equals(today) || !to.equals(today))) {
                throw new ApiException(403, "Cashiers can only generate today's report");
            }
            if (to.isBefore(from)) {
                throw new ApiException(400, "The end date must be on or after the start date");
            }
            if (to.isAfter(today)) {
                throw new ApiException(400, "The report cannot include future dates");
            }
            if (ChronoUnit.DAYS.between(from, to) > 366) {
                throw new ApiException(400, "Reports can cover at most one year");
            }
            Map<String, Object> report = table.salesReport(from, to, user.canViewSalesHistory(), user.getId());
            report.put("generatedAt", OffsetDateTime.now(Order.STORE_ZONE));
            report.put("generatedBy", user.getFullName());
            report.put("generatedByNo", user.getEmployeeNo());
            report.put("scope", user.canViewSalesHistory() ? "ALL" : "TODAY");
            return report;
        }

        private LocalDate date(String value, LocalDate fallback) {
            if (value == null) {
                return fallback;
            }
            try {
                return LocalDate.parse(value);
            } catch (DateTimeParseException e) {
                throw new ApiException(400, "Dates must look like 2026-11-13");
            }
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

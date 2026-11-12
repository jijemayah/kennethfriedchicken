package com.kfc.pos.http;

import com.kfc.pos.table.EmployeeTable;
import com.kfc.pos.model.Employee;
import com.kfc.pos.model.Validator;
import com.kfc.pos.service.AuthService;
import com.kfc.pos.service.PasswordHasher;

/**
 * Manager only.
 * GET/POST /api/employees, PUT /api/employees/{id}, DELETE /api/employees/{id} (deactivate)
 */
public class EmployeeHandler extends BaseHandler {

    private final EmployeeTable table;

    public EmployeeHandler(AuthService auth, EmployeeTable table) {
        super(auth);
        this.table = table;
    }

    @Override
    protected Object handle(Request req) throws Exception {
        Employee user = requireLogin(req);
        requirePermission(user.canManageEmployees());

        if (req.segmentCount() == 0) {
            switch (req.method()) {
                case "GET":
                    return JsonMapper.list(table.findAll(), JsonMapper::employee);
                case "POST": {
                    JsonBody body = req.body();
                    String password = body.getString("password");
                    Validator.requirePassword(password);
                    // Employee.create picks Cashier or Manager based on the role.
                    Employee created = Employee.create(body.getString("role"), 0, body.getString("firstName"),
                            body.getString("lastName"), body.getString("username"),
                            PasswordHasher.hash(password), true);
                    req.setStatus(201);
                    return JsonMapper.employee(table.create(created));
                }
                default:
                    throw methodNotAllowed();
            }
        }

        int id = req.idAt(0);
        Employee existing = table.findById(id).orElseThrow(() -> notFound("Employee"));
        switch (req.method()) {
            case "PUT": {
                JsonBody body = req.body();
                String hash = existing.getPasswordHash();
                String newPassword = body.getString("password");
                if (newPassword != null && !newPassword.isBlank()) {
                    Validator.requirePassword(newPassword);
                    hash = PasswordHasher.hash(newPassword);
                }
                boolean active = body.getBoolean("active", existing.isActive());
                String role = body.has("role") ? body.getString("role") : existing.getRole();
                if (id == user.getId() && (!active || !"MANAGER".equals(role))) {
                    throw new ApiException(400, "You cannot deactivate or demote your own account");
                }
                // A role change means a different subclass, so build a fresh object.
                Employee updated = Employee.create(role, id, body.getString("firstName"),
                        body.getString("lastName"), body.getString("username"), hash, active);
                table.update(updated);
                return JsonMapper.employee(updated);
            }
            case "DELETE":
                if (id == user.getId()) {
                    throw new ApiException(400, "You cannot deactivate your own account");
                }
                table.delete(id);
                return null;
            default:
                throw methodNotAllowed();
        }
    }
}

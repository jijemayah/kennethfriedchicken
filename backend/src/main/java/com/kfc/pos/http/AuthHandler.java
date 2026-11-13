package com.kfc.pos.http;

import com.kfc.pos.model.Employee;
import com.kfc.pos.service.AuthService;

import java.util.LinkedHashMap;
import java.util.Map;

public class AuthHandler extends BaseHandler {
    public AuthHandler(AuthService auth) {
        super(auth);
    }

    @Override
    protected Object handle(Request req) throws Exception {
        String action = req.segment(0);

        if ("login".equals(action) && req.method().equals("POST")) {
            JsonBody body = req.body();
            String token = auth.login(body.getString("username"), body.getString("password"))
                    .orElseThrow(() -> new ApiException(401, "Wrong username or password"));
            Employee employee = auth.findByToken(token).orElseThrow();
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("token", token);
            result.put("employee", JsonMapper.employee(employee));
            return result;
        }
        if ("logout".equals(action) && req.method().equals("POST")) {
            auth.logout(req.bearerToken());
            return null;
        }
        if ("me".equals(action) && req.method().equals("GET")) {
            return JsonMapper.employee(requireLogin(req));
        }
        throw notFound("Endpoint");
    }
}

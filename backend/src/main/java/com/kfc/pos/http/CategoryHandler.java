package com.kfc.pos.http;

import com.kfc.pos.table.CategoryTable;
import com.kfc.pos.model.Category;
import com.kfc.pos.model.Employee;
import com.kfc.pos.service.AuthService;

/** GET/POST /api/categories, PUT/DELETE /api/categories/{id} */
public class CategoryHandler extends BaseHandler {

    private final CategoryTable table;

    public CategoryHandler(AuthService auth, CategoryTable table) {
        super(auth);
        this.table = table;
    }

    @Override
    protected Object handle(Request req) throws Exception {
        Employee user = requireLogin(req);

        if (req.segmentCount() == 0) {
            switch (req.method()) {
                case "GET":
                    return JsonMapper.list(table.findAll(), JsonMapper::category);
                case "POST": {
                    requirePermission(user.canManageProducts());
                    JsonBody body = req.body();
                    Category created = table.create(new Category(0, body.getString("name"), body.getString("description")));
                    req.setStatus(201);
                    return JsonMapper.category(created);
                }
                default:
                    throw methodNotAllowed();
            }
        }

        int id = req.idAt(0);
        requirePermission(user.canManageProducts());
        Category category = table.findById(id).orElseThrow(() -> notFound("Category"));
        switch (req.method()) {
            case "PUT": {
                JsonBody body = req.body();
                category.setName(body.getString("name"));
                category.setDescription(body.getString("description"));
                table.update(category);
                return JsonMapper.category(category);
            }
            case "DELETE":
                if (category.getProductCount() > 0) {
                    throw new ApiException(409, "Move or delete the products in this category first");
                }
                table.delete(id);
                return null;
            default:
                throw methodNotAllowed();
        }
    }
}

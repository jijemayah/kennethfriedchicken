package com.kfc.pos.http;

import com.kfc.pos.table.ProductTable;
import com.kfc.pos.model.Employee;
import com.kfc.pos.model.Product;
import com.kfc.pos.service.AuthService;

import java.util.Map;

/**
 * GET  /api/products            active products (POS)   ?all=true → include hidden ones
 * POST /api/products            create (manager)
 * GET/PUT/DELETE /api/products/{id}
 */
public class ProductHandler extends BaseHandler {

    private final ProductTable table;

    public ProductHandler(AuthService auth, ProductTable table) {
        super(auth);
        this.table = table;
    }

    @Override
    protected Object handle(Request req) throws Exception {
        Employee user = requireLogin(req);

        if (req.segmentCount() == 0) {
            switch (req.method()) {
                case "GET":
                    boolean all = "true".equals(req.query("all"));
                    return JsonMapper.list(all ? table.findAll() : table.findActive(), JsonMapper::product);
                case "POST": {
                    requirePermission(user.canManageProducts());
                    JsonBody body = req.body();
                    Product product = fromBody(0, body);
                    product.setStockQuantity(body.getInt("stock", 0));
                    req.setStatus(201);
                    return JsonMapper.product(table.create(product));
                }
                default:
                    throw methodNotAllowed();
            }
        }

        int id = req.idAt(0);
        Product existing = table.findById(id).orElseThrow(() -> notFound("Product"));
        switch (req.method()) {
            case "GET":
                return JsonMapper.product(existing);
            case "PUT": {
                requirePermission(user.canManageProducts());
                Product updated = fromBody(id, req.body());
                table.update(updated);
                return JsonMapper.product(table.findById(id).orElseThrow());
            }
            case "DELETE": {
                requirePermission(user.canManageProducts());
                boolean deleted = table.deleteOrDeactivate(id);
                return Map.of("deleted", deleted, "message", deleted
                        ? "Product deleted"
                        : "Product has past orders, so it was hidden instead of deleted");
            }
            default:
                throw methodNotAllowed();
        }
    }

    /** The Product constructor and setters do all the validation. */
    private Product fromBody(int id, JsonBody body) {
        return new Product(id, body.getInt("categoryId", 0), body.getString("name"),
                body.getString("description"), body.getDecimal("price"), body.getString("imageUrl"),
                body.getBoolean("active", true));
    }
}

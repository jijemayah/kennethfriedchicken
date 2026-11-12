package com.kfc.pos.http;

import com.kfc.pos.table.InventoryTable;
import com.kfc.pos.model.Employee;
import com.kfc.pos.model.InventoryItem;
import com.kfc.pos.service.AuthService;

/**
 * GET  /api/inventory
 * POST /api/inventory/{productId}/adjust   { "change": 24 }  or  { "change": -3 }
 * PUT  /api/inventory/{productId}          { "quantity": 50, "reorderLevel": 15 }  (both optional)
 */
public class InventoryHandler extends BaseHandler {

    private final InventoryTable table;

    public InventoryHandler(AuthService auth, InventoryTable table) {
        super(auth);
        this.table = table;
    }

    @Override
    protected Object handle(Request req) throws Exception {
        Employee user = requireLogin(req);

        if (req.segmentCount() == 0 && req.method().equals("GET")) {
            return JsonMapper.list(table.findAll(), JsonMapper::inventory);
        }

        requirePermission(user.canManageInventory());
        int productId = req.idAt(0);
        InventoryItem item = table.findByProductId(productId).orElseThrow(() -> notFound("Inventory item"));
        JsonBody body = req.body();

        if ("adjust".equals(req.segment(1)) && req.method().equals("POST")) {
            int change = body.getInt("change", 0);
            // Encapsulation: the item itself decides if the change is allowed.
            if (change > 0) {
                item.addStock(change);
            } else {
                item.removeStock(-change);
            }
        } else if (req.segmentCount() == 1 && req.method().equals("PUT")) {
            // Set an exact count (e.g. after a physical stock count).
            // The difference still goes through addStock/removeStock so the rules stay in one place.
            Integer quantity = body.getInt("quantity");
            if (quantity != null) {
                if (quantity < 0) {
                    throw new ApiException(400, "Quantity cannot be negative");
                }
                int difference = quantity - item.getQuantity();
                if (difference > 0) {
                    item.addStock(difference);
                } else if (difference < 0) {
                    item.removeStock(-difference);
                }
            }
            item.setReorderLevel(body.getInt("reorderLevel", item.getReorderLevel()));
        } else {
            throw methodNotAllowed();
        }

        table.save(item);
        return JsonMapper.inventory(table.findByProductId(productId).orElseThrow());
    }
}

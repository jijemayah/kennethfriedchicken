-- Upgrades an existing database (created with the old schema.sql) without deleting any data.
-- Run once in the Supabase SQL Editor. It is safe to run again: every step checks first.
BEGIN;

-- Employee number EMP-001, EMP-002, ... generated from employee_id.
ALTER TABLE employee ADD COLUMN IF NOT EXISTS employee_no VARCHAR(12) GENERATED ALWAYS AS (
    'EMP-' || CASE WHEN employee_id < 1000 THEN LPAD(employee_id::text, 3, '0') ELSE employee_id::text END) STORED;
CREATE UNIQUE INDEX IF NOT EXISTS employee_employee_no_key ON employee (employee_no);

-- Drive-thru menu: rice bowls, sides and desserts are not sold at the drive-thru.
ALTER TABLE category ADD COLUMN IF NOT EXISTS drive_thru BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE category SET drive_thru = FALSE WHERE name IN ('Rice Bowls', 'Sides', 'Desserts');

-- Order type, discount and void/refund columns.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type     VARCHAR(12)   NOT NULL DEFAULT 'DINE_IN';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_type  VARCHAR(10)   NOT NULL DEFAULT 'NONE';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_id_no VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount       NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at   TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by   INT REFERENCES employee (employee_id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason  VARCHAR(200);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_discount_type_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_discount_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_cancel_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_discount_id_check;
UPDATE orders SET cancelled_at = created_at WHERE status <> 'COMPLETED' AND cancelled_at IS NULL;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('COMPLETED', 'VOIDED', 'REFUNDED'));
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check
    CHECK (order_type IN ('DINE_IN', 'TAKE_OUT', 'DELIVERY', 'FOOD_APP', 'DRIVE_THRU'));
ALTER TABLE orders ADD CONSTRAINT orders_discount_type_check
    CHECK (discount_type IN ('NONE', 'SENIOR', 'PWD', 'EMPLOYEE'));
ALTER TABLE orders ADD CONSTRAINT orders_discount_check CHECK (discount >= 0);
ALTER TABLE orders ADD CONSTRAINT orders_cancel_check CHECK ((status = 'COMPLETED') = (cancelled_at IS NULL));
ALTER TABLE orders ADD CONSTRAINT orders_discount_id_check CHECK ((discount_type = 'NONE') = (discount_id_no IS NULL));
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON orders (cancelled_at);

-- Per-item discount and VAT. Old orders get 12% of each line; their order totals are left as they were.
ALTER TABLE order_item ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE order_item ADD COLUMN IF NOT EXISTS vat      NUMERIC(10,2);
UPDATE order_item SET vat = ROUND(line_total * 0.12, 2) WHERE vat IS NULL;
ALTER TABLE order_item ALTER COLUMN vat SET DEFAULT 0;
ALTER TABLE order_item ALTER COLUMN vat SET NOT NULL;
ALTER TABLE order_item DROP CONSTRAINT IF EXISTS order_item_discount_check;
ALTER TABLE order_item DROP CONSTRAINT IF EXISTS order_item_vat_check;
ALTER TABLE order_item ADD CONSTRAINT order_item_discount_check CHECK (discount >= 0 AND discount <= line_total);
ALTER TABLE order_item ADD CONSTRAINT order_item_vat_check CHECK (vat >= 0);

ALTER TABLE payment DROP CONSTRAINT IF EXISTS payment_status_check;
ALTER TABLE payment ADD CONSTRAINT payment_status_check CHECK (status IN ('PAID', 'VOIDED', 'REFUNDED'));

CREATE INDEX IF NOT EXISTS idx_customer_name ON customer (LOWER(full_name));

-- Menu renames. Old receipts keep the name that was printed at the time (order_item.product_name).
UPDATE product SET name = '1-pc Hot Kenneth'      WHERE name = '1-pc Hot & Crispy';
UPDATE product SET name = '2-pc Hot Kenneth'      WHERE name = '2-pc Hot & Crispy';
UPDATE product SET name = '3-pc Kenneth Tenders'  WHERE name = '3-pc Chicken Tenders';
UPDATE product SET name = 'Sandwich Kenneth'      WHERE name = 'Classic Chicken Sandwich';
UPDATE product SET name = 'Drueco Wrap'           WHERE name = 'Twister Wrap';
UPDATE product SET name = 'Kenneth Ala King Bowl' WHERE name = 'Chicken Ala King Bowl';
UPDATE product SET name = 'Teriyaki Kenneth Bowl' WHERE name = 'Teriyaki Chicken Bowl';
UPDATE product SET name = 'Sundae'                WHERE name = 'Chocolate Sundae';
UPDATE product SET name = 'Mango Float'           WHERE name = 'Mango Float Cup';
UPDATE product SET name = 'Iced Tea'              WHERE name = 'Iced Tea (Regular)';
UPDATE product SET name = 'Coke'                  WHERE name = 'Coke (Regular)';

-- New demo passwords (see README). Stored as PBKDF2 hashes, never as plain text.
UPDATE employee SET password_hash = '120000:ieu8f+516piiRzscjYEMmw==:r2rvWbTokrK84QKU0ohdERF22AVukHVv2NJWt8gUk/g=' WHERE username = 'kdrueco';
UPDATE employee SET password_hash = '120000:Uuuc2BuxsXWXH+d1u+ZXxw==:jK3DKkzVL8ASc5otIM/Dvn7glbYwpwlJoBmhztRtSRQ=' WHERE username = 'jesguerra';

COMMIT;

DROP TABLE IF EXISTS payment    CASCADE;
DROP TABLE IF EXISTS order_item CASCADE;
DROP TABLE IF EXISTS orders     CASCADE;
DROP TABLE IF EXISTS inventory  CASCADE;
DROP TABLE IF EXISTS product    CASCADE;
DROP TABLE IF EXISTS category   CASCADE;
DROP TABLE IF EXISTS customer   CASCADE;
DROP TABLE IF EXISTS employee   CASCADE;

CREATE TABLE employee (
    employee_id   SERIAL PRIMARY KEY,
    first_name    VARCHAR(60)  NOT NULL,
    last_name     VARCHAR(60)  NOT NULL,
    username      VARCHAR(30)  NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    role          VARCHAR(10)  NOT NULL CHECK (role IN ('CASHIER', 'MANAGER')),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    full_name   VARCHAR(120) NOT NULL,
    phone       VARCHAR(15),
    email       VARCHAR(120),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE product (
    product_id  SERIAL PRIMARY KEY,
    category_id INT           NOT NULL REFERENCES category (category_id) ON DELETE RESTRICT,
    name        VARCHAR(100)  NOT NULL UNIQUE,
    description VARCHAR(255),
    price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url   VARCHAR(500),
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory (
    inventory_id  SERIAL PRIMARY KEY,
    product_id    INT         NOT NULL UNIQUE REFERENCES product (product_id) ON DELETE CASCADE,
    quantity      INT         NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level INT         NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    order_id    SERIAL PRIMARY KEY,
    employee_id INT           NOT NULL REFERENCES employee (employee_id),
    customer_id INT           REFERENCES customer (customer_id) ON DELETE SET NULL,
    subtotal    NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    vat         NUMERIC(10,2) NOT NULL CHECK (vat >= 0),
    total       NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    status      VARCHAR(12)   NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'VOIDED')),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE order_item (
    order_item_id SERIAL PRIMARY KEY,
    order_id      INT           NOT NULL REFERENCES orders (order_id) ON DELETE CASCADE,
    product_id    INT           NOT NULL REFERENCES product (product_id),
    product_name  VARCHAR(100)  NOT NULL,
    quantity      INT           NOT NULL CHECK (quantity > 0),
    unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    line_total    NUMERIC(10,2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE payment (
    payment_id      SERIAL PRIMARY KEY,
    order_id        INT           NOT NULL UNIQUE REFERENCES orders (order_id) ON DELETE CASCADE,
    method          VARCHAR(10)   NOT NULL CHECK (method IN ('CASH', 'GCASH', 'CARD')),
    amount_due      NUMERIC(10,2) NOT NULL CHECK (amount_due >= 0),
    amount_tendered NUMERIC(10,2) NOT NULL CHECK (amount_tendered >= amount_due),
    change_amount   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
    reference_no    VARCHAR(40)   NOT NULL,
    details         VARCHAR(100),
    status          VARCHAR(10)   NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'REFUNDED')),
    paid_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_category  ON product (category_id);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_orders_employee   ON orders (employee_id);
CREATE INDEX idx_order_item_order  ON order_item (order_id);
CREATE INDEX idx_order_item_prod   ON order_item (product_id);

ALTER TABLE employee   ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer   ENABLE ROW LEVEL SECURITY;
ALTER TABLE category   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment    ENABLE ROW LEVEL SECURITY;

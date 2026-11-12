-- =====================================================================
-- Kenneth Fried Chicken (KFC) POS - sample data. Run AFTER schema.sql.
--
-- DEMO ACCOUNTS (placeholder credentials for the project defense only):
--   Manager : kdrueco    / ChangeMe123
--   Cashier : jesguerra  / ChangeMe123
-- Passwords are stored as PBKDF2 hashes. Change them after deploying.
-- =====================================================================

-- ---------------------------------------------------------------- employees
INSERT INTO employee (employee_id, first_name, last_name, username, password_hash, role) VALUES
(1, 'John Kenneth',     'Drueco',   'kdrueco',   '120000:pj9iqa5t4TdM5z2u5RV/6Q==:fAzMXW7TMd4hKvOvrghFhfGymbFftDVZVsBqI2Qq0qQ=', 'MANAGER'),
(2, 'Jeremiah Joshua',  'Esguerra', 'jesguerra', '120000:OMpQ6B3mRLV2TiTHS+JUEQ==:73NS8UQ8bBOlY23N4qH/JK7/+9EYWxKnXnjk9bpcfww=', 'CASHIER');

-- ---------------------------------------------------------------- customers
INSERT INTO customer (customer_id, full_name, phone, email) VALUES
(1, 'Euwan Cuesta',           '09171234501', 'euwan.cuesta@example.com'),
(2, 'Sean Gener',             '09181234502', 'sean.gener@example.com'),
(3, 'Sebastian Cuvin',        '09191234503', NULL),
(4, 'Jose Andre Evangelista', '09201234504', 'jose.evangelista@example.com'),
(5, 'Jake Andrei De Vera',    '09211234505', NULL);

-- ---------------------------------------------------------------- categories
INSERT INTO category (category_id, name, description) VALUES
(1, 'Fried Chicken',       'Signature crispy fried chicken meals'),
(2, 'Buckets',             'Sharing buckets for groups and families'),
(3, 'Burgers & Sandwiches','Chicken burgers, wraps and sandwiches'),
(4, 'Rice Bowls',          'Rice meals topped with chicken'),
(5, 'Sides',               'Fries, gravy, coleslaw and more'),
(6, 'Drinks',              'Iced tea, soda, and coffee'),
(7, 'Desserts',            'Sweet treats and sundaes');

-- ---------------------------------------------------------------- products
INSERT INTO product (product_id, category_id, name, description, price) VALUES
( 1, 1, '1-pc Kenneth Original',    '1 piece original recipe chicken with rice',       99.00),
( 2, 1, '2-pc Kenneth Original',    '2 pieces original recipe chicken with rice',     179.00),
( 3, 1, '1-pc Hot & Crispy',        '1 piece spicy crispy chicken with rice',         105.00),
( 4, 1, '2-pc Hot & Crispy',        '2 pieces spicy crispy chicken with rice',        189.00),
( 5, 1, '3-pc Chicken Tenders',     'Boneless tenders with honey mustard dip',        139.00),
( 6, 2, '6-pc Family Bucket',       '6 pieces chicken, good for 3',                   499.00),
( 7, 2, '8-pc Barkada Bucket',      '8 pieces chicken with 4 rice and 2 sides',       749.00),
( 8, 2, '12-pc Party Bucket',       '12 pieces chicken for the whole group',          999.00),
( 9, 3, 'Kenneth Zinger Burger',    'Spicy chicken fillet, lettuce and mayo',         149.00),
(10, 3, 'Classic Chicken Sandwich', 'Crispy fillet with pickles on a brioche bun',    129.00),
(11, 3, 'Twister Wrap',             'Chicken strips, veggies and pepper sauce',       119.00),
(12, 4, 'Chicken Ala King Bowl',    'Creamy chicken ala king over rice',               89.00),
(13, 4, 'Spicy Popcorn Rice Bowl',  'Popcorn chicken, spicy sauce and egg',           109.00),
(14, 4, 'Teriyaki Chicken Bowl',    'Grilled chicken with sweet teriyaki glaze',       119.00),
(15, 5, 'Regular Fries',            'Golden crispy fries',                             55.00),
(16, 5, 'Large Fries',              'Golden crispy fries, large',                      79.00),
(17, 5, 'Mashed Potato & Gravy',    'Creamy mashed potato with signature gravy',       49.00),
(18, 5, 'Coleslaw',                 'Fresh and creamy coleslaw',                       45.00),
(19, 5, 'Extra Rice',               'Steamed white rice',                              25.00),
(20, 6, 'Iced Tea (Regular)',       'House-brewed lemon iced tea',                     45.00),
(21, 6, 'Coke (Regular)',           'Ice cold Coca-Cola',                              49.00),
(22, 6, 'Hot Brewed Coffee',        'Freshly brewed coffee',                           59.00),
(23, 7, 'Chocolate Sundae',         'Vanilla soft serve with chocolate fudge',         49.00),
(24, 7, 'Mango Float Cup',          'Graham, cream and Philippine mango',              65.00),
(25, 7, 'Egg Pie Slice',            'Classic baked egg custard pie',                   39.00);

-- ---------------------------------------------------------------- inventory
-- A few items are at or below the reorder level so the dashboard shows alerts.
INSERT INTO inventory (product_id, quantity, reorder_level) VALUES
( 1, 120, 30), ( 2, 95, 30), ( 3, 80, 25), ( 4, 70, 25), ( 5, 60, 20),
( 6, 25, 8),   ( 7, 14, 6),  ( 8, 5, 6),   ( 9, 48, 15), (10, 40, 15),
(11, 12, 15),  (12, 55, 15), (13, 50, 15), (14, 9, 12),  (15, 150, 40),
(16, 110, 30), (17, 85, 25), (18, 60, 20), (19, 200, 50), (20, 140, 40),
(21, 130, 40), (22, 45, 15), (23, 6, 10),  (24, 30, 10), (25, 28, 10);

-- ---------------------------------------------------------------- orders
-- Dates are relative to NOW() so the dashboard always shows the last 7 days.
-- Totals start at 0 and are calculated from order_item further below.
INSERT INTO orders (order_id, employee_id, customer_id, subtotal, vat, total, created_at) VALUES
( 1, 2, 1,    0, 0, 0, NOW() - INTERVAL '6 days 5 hours'),
( 2, 2, NULL, 0, 0, 0, NOW() - INTERVAL '6 days 3 hours'),
( 3, 1, 2,    0, 0, 0, NOW() - INTERVAL '6 days 1 hour'),
( 4, 2, NULL, 0, 0, 0, NOW() - INTERVAL '5 days 6 hours'),
( 5, 2, 3,    0, 0, 0, NOW() - INTERVAL '5 days 4 hours'),
( 6, 2, 4,    0, 0, 0, NOW() - INTERVAL '5 days 2 hours'),
( 7, 1, NULL, 0, 0, 0, NOW() - INTERVAL '4 days 7 hours'),
( 8, 2, 5,    0, 0, 0, NOW() - INTERVAL '4 days 5 hours'),
( 9, 2, 1,    0, 0, 0, NOW() - INTERVAL '4 days 2 hours'),
(10, 2, NULL, 0, 0, 0, NOW() - INTERVAL '3 days 6 hours'),
(11, 1, 2,    0, 0, 0, NOW() - INTERVAL '3 days 4 hours'),
(12, 2, NULL, 0, 0, 0, NOW() - INTERVAL '3 days 3 hours'),
(13, 2, 4,    0, 0, 0, NOW() - INTERVAL '3 days 1 hour'),
(14, 2, 3,    0, 0, 0, NOW() - INTERVAL '2 days 7 hours'),
(15, 2, NULL, 0, 0, 0, NOW() - INTERVAL '2 days 5 hours'),
(16, 1, 5,    0, 0, 0, NOW() - INTERVAL '2 days 3 hours'),
(17, 2, 1,    0, 0, 0, NOW() - INTERVAL '2 days 1 hour'),
(18, 2, NULL, 0, 0, 0, NOW() - INTERVAL '1 day 6 hours'),
(19, 2, 2,    0, 0, 0, NOW() - INTERVAL '1 day 4 hours'),
(20, 1, NULL, 0, 0, 0, NOW() - INTERVAL '1 day 3 hours'),
(21, 2, 4,    0, 0, 0, NOW() - INTERVAL '1 day 1 hour'),
(22, 2, NULL, 0, 0, 0, NOW() - INTERVAL '5 hours'),
(23, 2, 5,    0, 0, 0, NOW() - INTERVAL '4 hours'),
(24, 1, 3,    0, 0, 0, NOW() - INTERVAL '3 hours'),
(25, 2, NULL, 0, 0, 0, NOW() - INTERVAL '2 hours'),
(26, 2, 1,    0, 0, 0, NOW() - INTERVAL '1 hour'),
(27, 2, NULL, 0, 0, 0, NOW() - INTERVAL '25 minutes');

-- ---------------------------------------------------------------- order items
-- product_name and unit_price are copied from product (as checkout does).
INSERT INTO order_item (order_id, product_id, product_name, quantity, unit_price, line_total)
SELECT v.order_id, p.product_id, p.name, v.qty, p.price, p.price * v.qty
FROM (VALUES
    ( 1,  2, 1), ( 1, 20, 1), ( 1, 23, 1),
    ( 2,  1, 2), ( 2, 21, 2),
    ( 3,  6, 1), ( 3, 16, 1), ( 3, 20, 3),
    ( 4,  9, 1), ( 4, 15, 1), ( 4, 21, 1),
    ( 5, 12, 1), ( 5, 20, 1),
    ( 6,  4, 1), ( 6, 17, 1), ( 6, 24, 1),
    ( 7,  7, 1), ( 7, 20, 4),
    ( 8,  3, 2), ( 8, 19, 2), ( 8, 21, 2),
    ( 9, 10, 1), ( 9, 15, 1), ( 9, 22, 1),
    (10,  1, 1), (10, 17, 1), (10, 20, 1),
    (11,  8, 1), (11, 16, 2), (11, 21, 4),
    (12, 13, 2), (12, 20, 2),
    (13,  5, 1), (13, 18, 1), (13, 23, 1),
    (14,  2, 2), (14, 20, 2), (14, 25, 2),
    (15, 11, 1), (15, 15, 1), (15, 21, 1),
    (16,  6, 1), (16, 17, 2), (16, 20, 3),
    (17, 14, 1), (17, 22, 1),
    (18,  1, 3), (18, 19, 1), (18, 20, 3),
    (19,  9, 2), (19, 16, 1), (19, 21, 2),
    (20,  7, 1), (20, 24, 2), (20, 20, 4),
    (21,  3, 1), (21, 17, 1), (21, 21, 1),
    (22,  2, 1), (22, 23, 1),
    (23, 12, 2), (23, 20, 2),
    (24,  4, 1), (24, 15, 1), (24, 22, 1),
    (25, 10, 1), (25, 18, 1), (25, 21, 1),
    (26,  6, 1), (26, 16, 1), (26, 20, 3), (26, 24, 1),
    (27,  1, 1), (27, 20, 1)
) AS v(order_id, product_id, qty)
JOIN product p ON p.product_id = v.product_id;

-- Totals = sum of lines, VAT 12%, total = subtotal + VAT (same rule as Order.java).
UPDATE orders o SET
    subtotal = t.subtotal,
    vat      = ROUND(t.subtotal * 0.12, 2),
    total    = t.subtotal + ROUND(t.subtotal * 0.12, 2)
FROM (SELECT order_id, SUM(line_total) AS subtotal FROM order_item GROUP BY order_id) t
WHERE o.order_id = t.order_id;

-- ---------------------------------------------------------------- payments
-- Cash customers hand over the next 100 bill; GCash/Card pay the exact amount.
INSERT INTO payment (order_id, method, amount_due, amount_tendered, change_amount, reference_no, details, paid_at)
SELECT o.order_id, m.method, o.total,
       CASE WHEN m.method = 'CASH' THEN CEIL(o.total / 100) * 100 ELSE o.total END,
       CASE WHEN m.method = 'CASH' THEN CEIL(o.total / 100) * 100 - o.total ELSE 0 END,
       CASE m.method
            WHEN 'CASH'  THEN 'CASH-' || (1730000000000 + o.order_id * 3600000)
            WHEN 'GCASH' THEN '10' || LPAD((o.order_id * 7919)::text, 11, '0')
            ELSE 'AUTH-' || LPAD((o.order_id * 4241 % 1000000)::text, 6, '0') END,
       CASE m.method
            WHEN 'CASH'  THEN 'Cash'
            WHEN 'GCASH' THEN 'GCash 0917****' || LPAD((o.order_id * 37 % 1000)::text, 3, '0')
            ELSE CASE WHEN o.order_id % 2 = 0 THEN 'Visa **** 4242' ELSE 'Mastercard **** 4444' END END,
       o.created_at
FROM orders o
JOIN (VALUES
    ( 1, 'CASH'), ( 2, 'CASH'), ( 3, 'CARD'), ( 4, 'GCASH'), ( 5, 'CASH'), ( 6, 'GCASH'),
    ( 7, 'CARD'), ( 8, 'CASH'), ( 9, 'GCASH'), (10, 'CASH'), (11, 'CARD'), (12, 'CASH'),
    (13, 'GCASH'), (14, 'CASH'), (15, 'CASH'), (16, 'CARD'), (17, 'GCASH'), (18, 'CASH'),
    (19, 'GCASH'), (20, 'CARD'), (21, 'CASH'), (22, 'CASH'), (23, 'GCASH'), (24, 'CARD'),
    (25, 'CASH'), (26, 'GCASH'), (27, 'CASH')
) AS m(order_id, method) ON m.order_id = o.order_id;

-- ---------------------------------------------------------------- sequences
-- Explicit ids were used above, so move each SERIAL counter past them.
SELECT setval('employee_employee_id_seq', (SELECT MAX(employee_id) FROM employee));
SELECT setval('customer_customer_id_seq', (SELECT MAX(customer_id) FROM customer));
SELECT setval('category_category_id_seq', (SELECT MAX(category_id) FROM category));
SELECT setval('product_product_id_seq',   (SELECT MAX(product_id)  FROM product));
SELECT setval('inventory_inventory_id_seq', (SELECT MAX(inventory_id) FROM inventory));
SELECT setval('orders_order_id_seq',      (SELECT MAX(order_id)    FROM orders));
SELECT setval('order_item_order_item_id_seq', (SELECT MAX(order_item_id) FROM order_item));
SELECT setval('payment_payment_id_seq',   (SELECT MAX(payment_id)  FROM payment));

-- V6_1__seed_orders_and_payments.sql
-- Rich initial dataset for POS payments, Online revenue, Wholesale B2B sellers, and Customer spending grouping

-- 1. Ensure retail and wholesale customers exist in users
INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'sarah.j@gmail.com', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Sarah Jenkins', '+1-555-0201', 'RETAIL', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'dchen@greenpantry.com', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'David Chen (Green Pantry)', '+1-555-0202', 'WHOLESALE', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'elena@apexcafe.io', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Elena Rostova (Apex Cafe)', '+1-555-0203', 'WHOLESALE', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'david@summitnutrition.com', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Summit Peak Wellness Distributor', '+1-555-0204', 'WHOLESALE', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'sophia@pacificgrocers.org', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Pacific Coast Organic Grocers', '+1-555-0205', 'WHOLESALE', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'jonathan.brooks@techcorp.io', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Jonathan Brooks', '+1-555-0206', 'RETAIL', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'chloe.dupont@biolife.org', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Chloe Dupont', '+1-555-0207', 'RETAIL', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'maya.patel@austinhealth.com', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Maya Patel', '+1-555-0208', 'RETAIL', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'alex.m@lifestyle.net', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Alex Morgan', '+1-555-0209', 'RETAIL', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'liam.g@manchester.co', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Liam Gallagher', '+1-555-0210', 'RETAIL', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'emma.watson@creativearts.uk', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Emma Watson', '+1-555-0211', 'RETAIL', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT r.id, 'marcus@solsticemarkets.com', '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu', 'Marcus Vance', '+1-555-0212', 'RETAIL', TRUE
FROM roles r WHERE r.name = 'USER' ON CONFLICT (email) DO NOTHING;

-- 2. Wholesale Applications for B2B Wholesale Accounts
INSERT INTO wholesale_applications (user_id, business_name, tax_id_or_license, status, reviewed_at, admin_notes)
SELECT u.id, 'Green Pantry Co-op', 'TAX-GP-88391', 'APPROVED', CURRENT_TIMESTAMP, 'Verified organic co-op retail license'
FROM users u WHERE u.email = 'dchen@greenpantry.com' AND NOT EXISTS (SELECT 1 FROM wholesale_applications WHERE user_id = u.id);

INSERT INTO wholesale_applications (user_id, business_name, tax_id_or_license, status, reviewed_at, admin_notes)
SELECT u.id, 'Apex Artisan Cafe', 'TAX-APX-49102', 'APPROVED', CURRENT_TIMESTAMP, 'Direct cafe partnership'
FROM users u WHERE u.email = 'elena@apexcafe.io' AND NOT EXISTS (SELECT 1 FROM wholesale_applications WHERE user_id = u.id);

INSERT INTO wholesale_applications (user_id, business_name, tax_id_or_license, status, reviewed_at, admin_notes)
SELECT u.id, 'Summit Peak Wellness Distributor', 'TAX-SPW-99014', 'APPROVED', CURRENT_TIMESTAMP, 'Regional supplement distributor tier 1'
FROM users u WHERE u.email = 'david@summitnutrition.com' AND NOT EXISTS (SELECT 1 FROM wholesale_applications WHERE user_id = u.id);

INSERT INTO wholesale_applications (user_id, business_name, tax_id_or_license, status, reviewed_at, admin_notes)
SELECT u.id, 'Pacific Coast Grocers', 'TAX-PCG-10294', 'APPROVED', CURRENT_TIMESTAMP, 'Wholesale supermarket supply chain'
FROM users u WHERE u.email = 'sophia@pacificgrocers.org' AND NOT EXISTS (SELECT 1 FROM wholesale_applications WHERE user_id = u.id);

-- 3. Seed Orders (17 Diverse POS, Online, and Wholesale Orders)

-- Order 1: POS Walk-in Sarah Jenkins (Visit 1)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-POS-20261019-001', 'POS', u.id, c.id, 'In-Store POS Register Terminal #01', 'PAID', 'CARD', 'RETAIL', 21.50, 2.15, 23.65, CURRENT_TIMESTAMP - INTERVAL '2 days 4 hours'
FROM users u, users c WHERE u.email = 'sarah.j@gmail.com' AND c.email = 'cashier@retailstore.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 2: POS Walk-in Sarah Jenkins (Visit 2)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-POS-20261021-002', 'POS', u.id, c.id, 'In-Store POS Register Terminal #01', 'PAID', 'CARD', 'RETAIL', 18.50, 1.85, 20.35, CURRENT_TIMESTAMP - INTERVAL '3 hours'
FROM users u, users c WHERE u.email = 'sarah.j@gmail.com' AND c.email = 'cashier@retailstore.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 3: Wholehouse Seller David Chen (Green Pantry Order 1)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261019-W01', 'ONLINE', u.id, NULL, '4820 Redwood Blvd, Warehouse Bay 4, San Francisco CA', 'PAID', 'CARD', 'WHOLESALE', 308.00, 30.80, 338.80, CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM users u WHERE u.email = 'dchen@greenpantry.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 4: Wholehouse Seller David Chen (Green Pantry Order 2)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261021-W02', 'ONLINE', u.id, NULL, '4820 Redwood Blvd, Warehouse Bay 4, San Francisco CA', 'PAID', 'BANK_TRANSFER', 'WHOLESALE', 410.00, 41.00, 451.00, CURRENT_TIMESTAMP - INTERVAL '5 hours'
FROM users u WHERE u.email = 'dchen@greenpantry.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 5: Wholehouse Seller Elena Rostova (Apex Cafe Order 1)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261018-W03', 'ONLINE', u.id, NULL, '104 Pike Place Market, Seattle WA', 'PAID', 'CARD', 'WHOLESALE', 244.00, 24.40, 268.40, CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM users u WHERE u.email = 'elena@apexcafe.io'
ON CONFLICT (order_number) DO NOTHING;

-- Order 6: Wholehouse Seller Elena Rostova (Apex Cafe Order 2)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261020-W04', 'ONLINE', u.id, NULL, '104 Pike Place Market, Seattle WA', 'PAID', 'BANK_TRANSFER', 'WHOLESALE', 324.00, 32.40, 356.40, CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM users u WHERE u.email = 'elena@apexcafe.io'
ON CONFLICT (order_number) DO NOTHING;

-- Order 7: Wholehouse Seller Summit Peak Wellness Distributor (Large Wholesale Order 1)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261017-W05', 'ONLINE', u.id, NULL, '88 Boulder Creek Rd, Loading Dock B, Denver CO', 'PAID', 'BANK_TRANSFER', 'WHOLESALE', 1460.00, 146.00, 1606.00, CURRENT_TIMESTAMP - INTERVAL '4 days'
FROM users u WHERE u.email = 'david@summitnutrition.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 8: Wholehouse Seller Summit Peak Wellness Distributor (Large Wholesale Order 2)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261021-W06', 'ONLINE', u.id, NULL, '88 Boulder Creek Rd, Loading Dock B, Denver CO', 'PAID', 'BANK_TRANSFER', 'WHOLESALE', 1666.00, 166.60, 1832.60, CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM users u WHERE u.email = 'david@summitnutrition.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 9: Wholehouse Seller Pacific Coast Organic Grocers
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261019-W07', 'ONLINE', u.id, NULL, '770 Ocean Parkway, Distribution Center, Portland OR', 'PAID', 'CARD', 'WHOLESALE', 508.00, 50.80, 558.80, CURRENT_TIMESTAMP - INTERVAL '2 days 6 hours'
FROM users u WHERE u.email = 'sophia@pacificgrocers.org'
ON CONFLICT (order_number) DO NOTHING;

-- Order 10: Online Consumer Jonathan Brooks (Order 1)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261019-R01', 'ONLINE', u.id, NULL, '310 Mission St, Apt 14B, San Francisco CA', 'PAID', 'CARD', 'RETAIL', 96.00, 9.60, 105.60, CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM users u WHERE u.email = 'jonathan.brooks@techcorp.io'
ON CONFLICT (order_number) DO NOTHING;

-- Order 11: Online Consumer Jonathan Brooks (Order 2)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261021-R02', 'ONLINE', u.id, NULL, '310 Mission St, Apt 14B, San Francisco CA', 'PAID', 'CARD', 'RETAIL', 33.60, 3.36, 36.96, CURRENT_TIMESTAMP - INTERVAL '4 hours'
FROM users u WHERE u.email = 'jonathan.brooks@techcorp.io'
ON CONFLICT (order_number) DO NOTHING;

-- Order 12: Online Consumer Chloe Dupont (Order 1)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261018-R03', 'ONLINE', u.id, NULL, '425 Rue Saint-Denis, Montreal QC', 'PAID', 'CARD', 'RETAIL', 49.00, 4.90, 53.90, CURRENT_TIMESTAMP - INTERVAL '3 days 2 hours'
FROM users u WHERE u.email = 'chloe.dupont@biolife.org'
ON CONFLICT (order_number) DO NOTHING;

-- Order 13: Online Consumer Chloe Dupont (Order 2)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261020-R04', 'ONLINE', u.id, NULL, '425 Rue Saint-Denis, Montreal QC', 'PAID', 'BANK_TRANSFER', 'RETAIL', 47.00, 4.70, 51.70, CURRENT_TIMESTAMP - INTERVAL '1 day 3 hours'
FROM users u WHERE u.email = 'chloe.dupont@biolife.org'
ON CONFLICT (order_number) DO NOTHING;

-- Order 14: Online Consumer Maya Patel
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261021-R05', 'ONLINE', u.id, NULL, '1504 Congress Ave, Austin TX', 'PAID', 'CARD', 'RETAIL', 47.00, 4.70, 51.70, CURRENT_TIMESTAMP - INTERVAL '6 hours'
FROM users u WHERE u.email = 'maya.patel@austinhealth.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 15: Online Consumer Alex Morgan
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-ONL-20261020-R06', 'ONLINE', u.id, NULL, '920 Broadway, New York NY', 'PAID', 'CARD', 'RETAIL', 44.20, 4.42, 48.62, CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM users u WHERE u.email = 'alex.m@lifestyle.net'
ON CONFLICT (order_number) DO NOTHING;

-- Order 16: POS Walk-in Liam Gallagher (Visit 1)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-POS-20261020-P03', 'POS', u.id, c.id, 'In-Store POS Register Terminal #01', 'PAID', 'CASH', 'RETAIL', 21.00, 2.10, 23.10, CURRENT_TIMESTAMP - INTERVAL '1 day 5 hours'
FROM users u, users c WHERE u.email = 'liam.g@manchester.co' AND c.email = 'cashier@retailstore.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 17: POS Walk-in Liam Gallagher (Visit 2)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-POS-20261021-P04', 'POS', u.id, c.id, 'In-Store POS Register Terminal #01', 'PAID', 'CARD', 'RETAIL', 21.50, 2.15, 23.65, CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM users u, users c WHERE u.email = 'liam.g@manchester.co' AND c.email = 'cashier@retailstore.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 18: POS Walk-in Emma Watson
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-POS-20261021-P05', 'POS', u.id, c.id, 'In-Store POS Register Terminal #01', 'PAID', 'CARD', 'RETAIL', 18.40, 1.84, 20.24, CURRENT_TIMESTAMP - INTERVAL '1 hour'
FROM users u, users c WHERE u.email = 'emma.watson@creativearts.uk' AND c.email = 'cashier@retailstore.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 19: POS Walk-in Marcus Vance
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-POS-20261020-P06', 'POS', u.id, c.id, 'In-Store POS Register Terminal #01', 'PAID', 'BANK_TRANSFER', 'RETAIL', 42.50, 4.25, 46.75, CURRENT_TIMESTAMP - INTERVAL '18 hours'
FROM users u, users c WHERE u.email = 'marcus@solsticemarkets.com' AND c.email = 'cashier@retailstore.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 20: Anonymous Walk-in Guest (Cash Register)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-POS-20261021-P07', 'POS', NULL, c.id, 'In-Store POS Register Terminal #01', 'PAID', 'CASH', 'RETAIL', 15.00, 1.50, 16.50, CURRENT_TIMESTAMP - INTERVAL '45 minutes'
FROM users c WHERE c.email = 'cashier@retailstore.com'
ON CONFLICT (order_number) DO NOTHING;

-- Order 21: Anonymous Walk-in Guest (Card Register)
INSERT INTO orders (order_number, channel, user_id, cashier_id, shipping_address, status, payment_method, pricing_tier_used, subtotal, tax_amount, total_amount, created_at)
SELECT 'ORD-POS-20261021-P08', 'POS', NULL, c.id, 'In-Store POS Register Terminal #01', 'PAID', 'CARD', 'RETAIL', 16.00, 1.60, 17.60, CURRENT_TIMESTAMP - INTERVAL '20 minutes'
FROM users c WHERE c.email = 'cashier@retailstore.com'
ON CONFLICT (order_number) DO NOTHING;

-- 4. Seed Purchased Line Items for Each Order

-- Line Items for Order 1 (Sarah Jenkins #1: Cold Brew + Dark Chocolate)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 4.75, 9.50 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261019-001' AND p.sku = 'SKU-COLD-BREW'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 6.00, 12.00 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261019-001' AND p.sku = 'SKU-DARK-CHOC'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 2 (Sarah Jenkins #2: Matcha Latte + Energy Bar)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 3, 5.00, 15.00 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-002' AND p.sku = 'SKU-MATCHA-LATTE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 1, 3.50, 3.50 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-002' AND p.sku = 'SKU-ENERGY-BAR'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 3 (David Chen #1: Bulk Oat Milk + Cold Brew)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 60, 3.00, 180.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261019-W01' AND p.sku = 'SKU-OAT-MILK'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 40, 3.20, 128.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261019-W01' AND p.sku = 'SKU-COLD-BREW'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 4 (David Chen #2: Bulk Energy Bars + Dark Choc)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 80, 2.50, 200.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261021-W02' AND p.sku = 'SKU-ENERGY-BAR'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 50, 4.20, 210.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261021-W02' AND p.sku = 'SKU-DARK-CHOC'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 5 (Elena Rostova #1: Bulk Matcha + Cold Brew)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 50, 3.60, 180.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261018-W03' AND p.sku = 'SKU-MATCHA-LATTE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 20, 3.20, 64.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261018-W03' AND p.sku = 'SKU-COLD-BREW'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 6 (Elena Rostova #2: Bulk Oat Milk + Truffle Chips)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 70, 3.00, 210.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261020-W04' AND p.sku = 'SKU-OAT-MILK'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 30, 3.80, 114.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261020-W04' AND p.sku = 'SKU-CHIP-TRUFFLE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 7 (Summit Peak Distributor #1: Protein Whey + Energy Bars)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 40, 29.00, 1160.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261017-W05' AND p.sku = 'SKU-PROTEIN-WHEY'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 120, 2.50, 300.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261017-W05' AND p.sku = 'SKU-ENERGY-BAR'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 8 (Summit Peak Distributor #2: Protein Whey + Matcha)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 50, 29.00, 1450.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261021-W06' AND p.sku = 'SKU-PROTEIN-WHEY'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 60, 3.60, 216.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261021-W06' AND p.sku = 'SKU-MATCHA-LATTE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 9 (Pacific Coast Grocers: Sparkling Water + Truffle Chips + Dark Choc)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 80, 1.40, 112.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261019-W07' AND p.sku = 'SKU-SPARKLING-H2O'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 60, 3.80, 228.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261019-W07' AND p.sku = 'SKU-CHIP-TRUFFLE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 40, 4.20, 168.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261019-W07' AND p.sku = 'SKU-DARK-CHOC'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 10 (Jonathan Brooks #1: Matcha + Protein Whey)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 4, 5.00, 20.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261019-R01' AND p.sku = 'SKU-MATCHA-LATTE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 38.00, 76.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261019-R01' AND p.sku = 'SKU-PROTEIN-WHEY'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 11 (Jonathan Brooks #2: Energy Bars + Oat Milk)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 6, 3.50, 21.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261021-R02' AND p.sku = 'SKU-ENERGY-BAR'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 3, 4.20, 12.60 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261021-R02' AND p.sku = 'SKU-OAT-MILK'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 12 (Chloe Dupont #1: Dark Choc + Cold Brew)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 5, 6.00, 30.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261018-R03' AND p.sku = 'SKU-DARK-CHOC'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 4, 4.75, 19.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261018-R03' AND p.sku = 'SKU-COLD-BREW'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 13 (Chloe Dupont #2: Protein Whey + Sparkling Water)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 1, 38.00, 38.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261020-R04' AND p.sku = 'SKU-PROTEIN-WHEY'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 4, 2.25, 9.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261020-R04' AND p.sku = 'SKU-SPARKLING-H2O'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 14 (Maya Patel: Sparkling Water + Truffle Chips + Energy Bar)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 8, 2.25, 18.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261021-R05' AND p.sku = 'SKU-SPARKLING-H2O'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 4, 5.50, 22.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261021-R05' AND p.sku = 'SKU-CHIP-TRUFFLE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 3.50, 7.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261021-R05' AND p.sku = 'SKU-ENERGY-BAR'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 15 (Alex Morgan: Oat Milk + Cold Brew)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 6, 4.20, 25.20 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261020-R06' AND p.sku = 'SKU-OAT-MILK'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 4, 4.75, 19.00 FROM orders o, products p WHERE o.order_number = 'ORD-ONL-20261020-R06' AND p.sku = 'SKU-COLD-BREW'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 16 (Liam Gallagher #1: Truffle Chips + Sparkling Water)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 3, 5.50, 16.50 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261020-P03' AND p.sku = 'SKU-CHIP-TRUFFLE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 2.25, 4.50 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261020-P03' AND p.sku = 'SKU-SPARKLING-H2O'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 17 (Liam Gallagher #2: Cold Brew + Dark Choc)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 4.75, 9.50 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-P04' AND p.sku = 'SKU-COLD-BREW'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 6.00, 12.00 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-P04' AND p.sku = 'SKU-DARK-CHOC'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 18 (Emma Watson: Oat Milk + Matcha Latte)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 4.20, 8.40 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-P05' AND p.sku = 'SKU-OAT-MILK'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 5.00, 10.00 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-P05' AND p.sku = 'SKU-MATCHA-LATTE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 19 (Marcus Vance: Protein Whey + Sparkling Water)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 1, 38.00, 38.00 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261020-P06' AND p.sku = 'SKU-PROTEIN-WHEY'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 2.25, 4.50 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261020-P06' AND p.sku = 'SKU-SPARKLING-H2O'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 20 (Anonymous POS Cash: Cold Brew + Truffle Chips)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 4.75, 9.50 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-P07' AND p.sku = 'SKU-COLD-BREW'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 1, 5.50, 5.50 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-P07' AND p.sku = 'SKU-CHIP-TRUFFLE'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

-- Line Items for Order 21 (Anonymous POS Card: Sparkling Water + Energy Bar)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 4, 2.25, 9.00 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-P08' AND p.sku = 'SKU-SPARKLING-H2O'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 3.50, 7.00 FROM orders o, products p WHERE o.order_number = 'ORD-POS-20261021-P08' AND p.sku = 'SKU-ENERGY-BAR'
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id AND product_id = p.id);

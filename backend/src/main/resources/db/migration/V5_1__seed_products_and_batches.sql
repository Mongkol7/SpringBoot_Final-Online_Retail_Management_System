-- V5_1__seed_products_and_batches.sql
-- Seed categories, suppliers, products, and active inventory batches for POS and Cashier testing

-- 1. Categories
INSERT INTO categories (name, description) VALUES
    ('Beverages', 'Cold brew, artisanal teas, sparkling water, and canned drinks'),
    ('Snacks', 'Energy bars, gourmet crisps, roasted nuts, and confectionery'),
    ('Dairy & Plant Milk', 'Organic whole milk, barista oat milk, almond milk, and yogurt'),
    ('Nutrition & Supplements', 'Whey protein, matcha powders, meal replacements, and vitamins')
ON CONFLICT (name) DO NOTHING;

-- 2. Suppliers
INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES
    ('Apex Global Beverage Corp', 'Marcus Vance', 'marcus@apexbeverage.com', '+1-555-0321', '742 Evergreen Terrace, Springfield'),
    ('Verdant BioFarm Organics', 'Elena Rostova', 'elena@verdantorganics.com', '+1-555-0322', '120 Harvest Way, Portland'),
    ('Summit Performance Nutrition', 'David Sterling', 'david@summitnutrition.com', '+1-555-0323', '88 Boulder Creek Rd, Denver')
ON CONFLICT DO NOTHING;

-- 3. Ensure Stock Controller user exists
INSERT INTO roles (name) VALUES ('STOCK_CONTROLLER') ON CONFLICT (name) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT 
    r.id,
    'stock@retailstore.com',
    '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu',
    'Warehouse Stock Controller',
    '+1-555-0103',
    'RETAIL',
    TRUE
FROM roles r 
WHERE r.name = 'STOCK_CONTROLLER'
ON CONFLICT (email) DO NOTHING;

-- 4. Products with strict pricing hierarchy (cost <= wholesale <= retail)
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-ENERGY-BAR', 'Organic Energy Bar (Almond & Honey)', 'Raw cold-pressed almond butter with wildflower honey', 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=400&q=80', 1.80, 2.50, 3.50, 10, TRUE, FALSE
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-COLD-BREW', 'Artisan Cold Brew Coffee 330ml', 'Steeped for 20 hours with Ethiopian single-origin beans', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80', 2.20, 3.20, 4.75, 10, TRUE, FALSE
FROM categories c WHERE c.name = 'Beverages'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-SPARKLING-H2O', 'Sparkling Mineral Water 500ml', 'Naturally carbonated spring water in recycled glass', 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=400&q=80', 0.80, 1.40, 2.25, 15, FALSE, FALSE
FROM categories c WHERE c.name = 'Beverages'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-CHIP-TRUFFLE', 'Handcrafted Truffle Potato Crisps', 'Slow-cooked artisanal crisps with black summer truffle', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80', 2.50, 3.80, 5.50, 10, FALSE, FALSE
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-OAT-MILK', 'Barista Organic Oat Milk 1L', 'Steams to micro-foam perfection, non-GMO whole oats', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80', 2.10, 3.00, 4.20, 10, TRUE, FALSE
FROM categories c WHERE c.name = 'Dairy & Plant Milk'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-DARK-CHOC', 'Single Origin 85% Dark Chocolate 100g', 'Fair-trade Ecuadorian cacao with subtle citrus notes', 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=400&q=80', 3.00, 4.20, 6.00, 15, FALSE, FALSE
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-PROTEIN-WHEY', 'Vanilla Whey Protein Concentrate 1kg', 'Grass-fed dairy isolate with natural Madagascar vanilla', 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80', 22.00, 29.00, 38.00, 5, FALSE, FALSE
FROM categories c WHERE c.name = 'Nutrition & Supplements'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-MATCHA-LATTE', 'Ceremonial Grade Matcha Can 250ml', 'Shade-grown Uji matcha with light unsweetened almond base', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80', 2.50, 3.60, 5.00, 10, TRUE, FALSE
FROM categories c WHERE c.name = 'Beverages'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url;

-- 5. Product Batches (Physical Inventory for FIFO/FEFO Allocation)
INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-ENGBAR-01', p.id, s.id, 60, 60, CURRENT_DATE + INTERVAL '365 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-ENERGY-BAR' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-CLDBRW-01', p.id, s.id, 50, 50, CURRENT_DATE + INTERVAL '180 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-COLD-BREW' AND s.name = 'Apex Global Beverage Corp'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-SPKH2O-01', p.id, s.id, 120, 120, CURRENT_DATE + INTERVAL '730 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-SPARKLING-H2O' AND s.name = 'Apex Global Beverage Corp'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-TRFCHP-01', p.id, s.id, 40, 40, CURRENT_DATE + INTERVAL '300 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-CHIP-TRUFFLE' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-OATMLK-01', p.id, s.id, 35, 35, CURRENT_DATE + INTERVAL '120 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-OAT-MILK' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-DKCHOC-01', p.id, s.id, 75, 75, CURRENT_DATE + INTERVAL '500 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-DARK-CHOC' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-WHYPRO-01', p.id, s.id, 25, 25, CURRENT_DATE + INTERVAL '700 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-PROTEIN-WHEY' AND s.name = 'Summit Performance Nutrition'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-MTCLAT-01', p.id, s.id, 45, 45, CURRENT_DATE + INTERVAL '240 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-MATCHA-LATTE' AND s.name = 'Apex Global Beverage Corp'
ON CONFLICT (batch_code) DO NOTHING;

-- V5_2__update_product_image_urls.sql
-- Assign colorful 3D packaging image URLs to all catalog products

UPDATE products SET image_url = '/products/energy-bar.jpg' WHERE sku = 'SKU-ENERGY-BAR';
UPDATE products SET image_url = '/products/cold-brew.jpg' WHERE sku = 'SKU-COLD-BREW';
UPDATE products SET image_url = '/products/sparkling-water.jpg' WHERE sku = 'SKU-SPARKLING-H2O';
UPDATE products SET image_url = '/products/truffle-chips.jpg' WHERE sku = 'SKU-CHIP-TRUFFLE';
UPDATE products SET image_url = '/products/oat-milk.jpg' WHERE sku = 'SKU-OAT-MILK';
UPDATE products SET image_url = '/products/dark-chocolate.jpg' WHERE sku = 'SKU-DARK-CHOC';
UPDATE products SET image_url = '/products/whey-protein.jpg' WHERE sku = 'SKU-PROTEIN-WHEY';
UPDATE products SET image_url = '/products/matcha-latte.jpg' WHERE sku = 'SKU-MATCHA-LATTE';

-- Add additional colorful snack items from the Bento showcase
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-CHEDDAR-PUFFS', 'Cheesy Explosion Baked Cheddar Puffs', 'Wisconsin cheddar baked puffs and crispy golden nacho triangles', '/products/cheddar-puffs.jpg', 2.20, 3.20, 4.50, 15, FALSE, FALSE
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT (sku) DO UPDATE SET image_url = '/products/cheddar-puffs.jpg';

INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-SPICY-LIME', 'Spicy Chili Lime Artisanal Crisps', 'Fiery roasted habanero chili crunches paired with tangy Mexican lime zest', '/products/spicy-crisps.jpg', 2.40, 3.50, 5.25, 15, FALSE, FALSE
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT (sku) DO UPDATE SET image_url = '/products/spicy-crisps.jpg';

-- Batches for new products
INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-CHEDDAR-01', p.id, s.id, 80, 80, CURRENT_DATE + INTERVAL '240 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-CHEDDAR-PUFFS' AND s.name = 'Apex Global Beverage Corp'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-SPICYLIME-01', p.id, s.id, 75, 75, CURRENT_DATE + INTERVAL '240 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-SPICY-LIME' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

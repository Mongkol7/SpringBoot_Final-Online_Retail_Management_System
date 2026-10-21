-- V7_1__seed_twenty_new_products_and_batches.sql
-- Seed 20 additional premium products across various retail categories with active inventory batches

-- 1. Ensure categories exist
INSERT INTO categories (name, description) VALUES
    ('Bakery & Pastry', 'Fresh croissants, artisanal sourdough loaves, muffins, and bagels'),
    ('Fresh Produce', 'Farm-fresh organic fruits, vegetables, and greens'),
    ('Pantry & Condiments', 'Extra virgin olive oil, raw honey, organic nut butters, and spices'),
    ('Beverages', 'Cold brew, artisanal teas, sparkling water, kombucha, and juices'),
    ('Snacks', 'Energy bars, gourmet crisps, roasted nuts, and confectionery'),
    ('Dairy & Plant Milk', 'Organic whole milk, barista oat milk, almond milk, and artisan cheeses'),
    ('Nutrition & Supplements', 'Whey protein, creatine, electrolyte powders, and vitamins')
ON CONFLICT (name) DO NOTHING;

-- 2. Ensure suppliers exist
INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES
    ('Apex Global Beverage Corp', 'Marcus Vance', 'marcus@apexbeverage.com', '+1-555-0321', '742 Evergreen Terrace, Springfield'),
    ('Verdant BioFarm Organics', 'Elena Rostova', 'elena@verdantorganics.com', '+1-555-0322', '120 Harvest Way, Portland'),
    ('Summit Performance Nutrition', 'David Sterling', 'david@summitnutrition.com', '+1-555-0323', '88 Boulder Creek Rd, Denver'),
    ('Golden Crust Artisan Bakery', 'Claire Bennett', 'claire@goldencrust.com', '+1-555-0324', '45 Baker Street, Seattle'),
    ('Pacific Heritage Farms', 'Thomas Thorne', 'thomas@pacificheritage.com', '+1-555-0325', '900 Orchard Lane, Napa Valley')
ON CONFLICT DO NOTHING;

-- 3. Insert 20 New Products (with strict pricing cost <= wholesale <= retail)

-- 1. Almond Croissant
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-CROISSANT-ALM', 'Artisan Butter Croissant (Almond)', 'Flaky twice-baked butter croissant filled with frangipane cream and toasted sliced almonds', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80', 1.50, 2.40, 3.80, 10, TRUE, FALSE
FROM categories c WHERE c.name = 'Bakery & Pastry'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 2. Rustic Sourdough
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-SOURDOUGH-RUST', 'Rustic Country Sourdough Loaf', 'Naturally leavened 36-hour fermented wild yeast country loaf with blistered crust', 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80', 2.20, 3.50, 5.20, 10, TRUE, FALSE
FROM categories c WHERE c.name = 'Bakery & Pastry'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 3. Everything Bagel 4-Pack
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-BAGEL-EVERY', 'New York Everything Bagel 4-Pack', 'Kettle-boiled chewy sourdough bagels coated with poppy seed, toasted garlic, and onion', 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=400&q=80', 2.80, 4.20, 6.50, 8, TRUE, FALSE
FROM categories c WHERE c.name = 'Bakery & Pastry'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 4. Organic Hass Avocados
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-AVOCADO-HASS', 'Organic Hass Avocados (Pack of 3)', 'Tree-ripened creamy California Hass avocados rich in healthy monounsaturated fats', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80', 2.50, 3.80, 5.50, 15, TRUE, FALSE
FROM categories c WHERE c.name = 'Fresh Produce'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 5. Wild Mountain Blueberries
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-BERRIES-BLUE', 'Wild Mountain Blueberries 250g', 'Hand-picked organic wild mountain blueberries bursting with potent antioxidants', 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=400&q=80', 2.60, 3.90, 5.80, 10, TRUE, FALSE
FROM categories c WHERE c.name = 'Fresh Produce'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 6. Cold-Pressed Extra Virgin Olive Oil
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-OLIVE-OIL-EV', 'Extra Virgin Olive Oil 500ml', 'First cold-pressed single estate Koroneiki olives with peppery polyphenol finish', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80', 7.50, 10.50, 14.90, 10, FALSE, FALSE
FROM categories c WHERE c.name = 'Pantry & Condiments'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 7. Raw Manuka Honey MGO 250+
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-HONEY-MANUKA', 'Raw Manuka Honey MGO 250+ 250g', 'Authentic certified monofloral New Zealand Manuka honey with medicinal bio-activity', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80', 12.00, 16.50, 24.00, 6, FALSE, FALSE
FROM categories c WHERE c.name = 'Pantry & Condiments'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 8. Crunchy Roasted Peanut Butter
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-PEANUT-BUTTER', 'Crunchy Roasted Peanut Butter 350g', '100% dry-roasted runner peanuts with coarse sea salt, zero palm oil or additives', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80', 2.40, 3.60, 5.20, 12, FALSE, FALSE
FROM categories c WHERE c.name = 'Pantry & Condiments'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 9. Organic Ginger Lemon Kombucha
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-KOMBUCHA-GINGER', 'Organic Ginger Lemon Kombucha 330ml', 'Raw effervescent live probiotic tea cold-infused with organic Peruvian ginger root', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80', 1.80, 2.60, 3.95, 15, TRUE, FALSE
FROM categories c WHERE c.name = 'Beverages'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 10. Imperial Earl Grey Tea
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-TEA-EARLGREY', 'Imperial Earl Grey Tea 100g', 'Hand-plucked high-altitude Ceylon black tea perfumed with pure Calabrian bergamot oil', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80', 4.50, 6.50, 9.50, 10, FALSE, FALSE
FROM categories c WHERE c.name = 'Beverages'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 11. Pure King Coconut Water
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-COCO-WATER', 'Pure King Coconut Water 500ml', 'Single-source golden King coconut water naturally high in potassium and electrolytes', 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=400&q=80', 1.40, 2.10, 3.20, 20, FALSE, FALSE
FROM categories c WHERE c.name = 'Beverages'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 12. Green Detox Smoothie
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-GREEN-SMOOTHIE', 'Cold-Pressed Green Detox 300ml', 'Nutrient-dense raw cold-pressed spinach, celery, green apple, cucumber, and ginger', 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=400&q=80', 2.80, 4.00, 5.75, 10, TRUE, FALSE
FROM categories c WHERE c.name = 'Beverages'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 13. Artisan Maple Pecan Granola
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-GRANOLA-BERRY', 'Artisan Maple Pecan Granola 400g', 'Slow-baked rolled oats with roasted Georgia pecans and Grade A Vermont maple syrup', 'https://images.unsplash.com/photo-1517093157656-b9ec81c03e3a?auto=format&fit=crop&w=400&q=80', 3.80, 5.50, 7.90, 10, FALSE, FALSE
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 14. Smoked Rosemary Mixed Nuts
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-NUTS-ROASTED', 'Smoked Rosemary Mixed Nuts 200g', 'Kettle-roasted cashews, almonds, and walnuts infused with fresh rosemary and sea salt', 'https://images.unsplash.com/photo-1536591375315-1b8368903277?auto=format&fit=crop&w=400&q=80', 3.20, 4.80, 6.90, 12, FALSE, FALSE
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 15. Teriyaki Grass-Fed Beef Jerky
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-JERKY-BEEF', 'Grass-Fed Teriyaki Beef Jerky 85g', 'Artisanal hand-cut pasture-raised beef marinated in tamari ginger and honey teriyaki', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80', 4.20, 6.00, 8.50, 10, FALSE, FALSE
FROM categories c WHERE c.name = 'Snacks'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 16. Authentic Greek Strained Yogurt
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-YOGURT-GREEK', 'Authentic Greek Yogurt 500g', 'Triple-strained whole milk pasture-fed Greek yogurt with 18g natural protein per cup', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80', 2.30, 3.40, 4.80, 12, TRUE, FALSE
FROM categories c WHERE c.name = 'Dairy & Plant Milk'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 17. Unsweetened Vanilla Almond Milk
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-ALMOND-MILK', 'Organic Vanilla Almond Milk 1L', 'Sprouted California almonds cold-pressed with natural Madagascar bourbon vanilla', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80', 2.00, 2.90, 4.10, 10, TRUE, FALSE
FROM categories c WHERE c.name = 'Dairy & Plant Milk'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 18. Vintage Aged English Cheddar
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-CHEDDAR-AGED', 'Vintage Aged English Cheddar 200g', 'Cave-matured for 18 months, firm crumbly texture with crunchy calcium lactate crystals', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=400&q=80', 3.90, 5.60, 7.80, 8, TRUE, FALSE
FROM categories c WHERE c.name = 'Dairy & Plant Milk'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 19. Micronized Creatine Monohydrate
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-CREATINE-MONO', 'Micronized Creatine Monohydrate 500g', 'Ultra-pure 200 mesh pharmaceutical grade German creatine monohydrate for strength', 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&q=80', 14.00, 19.50, 26.50, 6, FALSE, FALSE
FROM categories c WHERE c.name = 'Nutrition & Supplements'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;

-- 20. Hydration Electrolyte Powder Packets
INSERT INTO products (category_id, sku, name, description, image_url, cost_price, wholesale_price, retail_price, min_stock_threshold, is_perishable, is_deleted)
SELECT c.id, 'SKU-ELECTROLYTE-PK', 'Hydration Electrolyte Packets (30x)', 'Optimal ratio of sodium, potassium, and magnesium citrate with real fruit flavor', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80', 11.50, 16.00, 22.90, 8, FALSE, FALSE
FROM categories c WHERE c.name = 'Nutrition & Supplements'
ON CONFLICT (sku) DO UPDATE SET image_url = EXCLUDED.image_url, retail_price = EXCLUDED.retail_price;


-- 4. Insert Inventory Batches for each of the 20 products for FIFO/FEFO allocation
INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-CRSALM-01', p.id, s.id, 40, 40, CURRENT_DATE + INTERVAL '30 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-CROISSANT-ALM' AND s.name = 'Golden Crust Artisan Bakery'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-SOURDG-01', p.id, s.id, 35, 35, CURRENT_DATE + INTERVAL '45 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-SOURDOUGH-RUST' AND s.name = 'Golden Crust Artisan Bakery'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-BAGEL-01', p.id, s.id, 30, 30, CURRENT_DATE + INTERVAL '60 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-BAGEL-EVERY' AND s.name = 'Golden Crust Artisan Bakery'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-AVOCAD-01', p.id, s.id, 60, 60, CURRENT_DATE + INTERVAL '14 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-AVOCADO-HASS' AND s.name = 'Pacific Heritage Farms'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-BLUEBR-01', p.id, s.id, 45, 45, CURRENT_DATE + INTERVAL '10 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-BERRIES-BLUE' AND s.name = 'Pacific Heritage Farms'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-EVOO-01', p.id, s.id, 50, 50, CURRENT_DATE + INTERVAL '730 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-OLIVE-OIL-EV' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-MANUKA-01', p.id, s.id, 30, 30, CURRENT_DATE + INTERVAL '1000 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-HONEY-MANUKA' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-PNUTBT-01', p.id, s.id, 65, 65, CURRENT_DATE + INTERVAL '365 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-PEANUT-BUTTER' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-KOMBCH-01', p.id, s.id, 70, 70, CURRENT_DATE + INTERVAL '180 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-KOMBUCHA-GINGER' AND s.name = 'Apex Global Beverage Corp'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-ERLGRY-01', p.id, s.id, 40, 40, CURRENT_DATE + INTERVAL '500 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-TEA-EARLGREY' AND s.name = 'Apex Global Beverage Corp'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-COCOH2O-01', p.id, s.id, 90, 90, CURRENT_DATE + INTERVAL '365 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-COCO-WATER' AND s.name = 'Apex Global Beverage Corp'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-GRNSMTH-01', p.id, s.id, 35, 35, CURRENT_DATE + INTERVAL '21 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-GREEN-SMOOTHIE' AND s.name = 'Pacific Heritage Farms'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-GRANOLA-01', p.id, s.id, 55, 55, CURRENT_DATE + INTERVAL '270 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-GRANOLA-BERRY' AND s.name = 'Golden Crust Artisan Bakery'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-ROSNUT-01', p.id, s.id, 65, 65, CURRENT_DATE + INTERVAL '365 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-NUTS-ROASTED' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-BFFJRK-01', p.id, s.id, 50, 50, CURRENT_DATE + INTERVAL '300 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-JERKY-BEEF' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-GRKYGT-01', p.id, s.id, 40, 40, CURRENT_DATE + INTERVAL '25 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-YOGURT-GREEK' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-ALMMLK-01', p.id, s.id, 45, 45, CURRENT_DATE + INTERVAL '90 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-ALMOND-MILK' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-CHEDAR-01', p.id, s.id, 40, 40, CURRENT_DATE + INTERVAL '120 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-CHEDDAR-AGED' AND s.name = 'Verdant BioFarm Organics'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-CREATN-01', p.id, s.id, 35, 35, CURRENT_DATE + INTERVAL '730 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-CREATINE-MONO' AND s.name = 'Summit Performance Nutrition'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO product_batches (batch_code, product_id, supplier_id, initial_quantity, current_quantity, expiry_date, is_expired)
SELECT 'BATCH-ELCTRO-01', p.id, s.id, 45, 45, CURRENT_DATE + INTERVAL '540 days', FALSE
FROM products p, suppliers s WHERE p.sku = 'SKU-ELECTROLYTE-PK' AND s.name = 'Summit Performance Nutrition'
ON CONFLICT (batch_code) DO NOTHING;

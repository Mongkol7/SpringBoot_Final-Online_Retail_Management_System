-- V8_3: Clean up extra product images in products table, keeping only the main cover image
UPDATE products 
SET images = jsonb_build_array(image_url)::text 
WHERE image_url IS NOT NULL AND image_url != '';

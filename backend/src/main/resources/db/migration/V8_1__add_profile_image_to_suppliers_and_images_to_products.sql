-- V8_1: Add profile_image to suppliers and images array support to products
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT;
ALTER TABLE products ALTER COLUMN image_url TYPE TEXT;

-- V8_2: Add avatar_url and company_name to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(150);

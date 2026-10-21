-- V8_0__add_soft_delete_to_suppliers_and_categories.sql
-- Enables light/soft delete for suppliers and categories to prevent hard database erasure and foreign key failures.

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

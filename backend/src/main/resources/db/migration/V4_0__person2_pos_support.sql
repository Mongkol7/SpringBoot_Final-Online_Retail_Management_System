-- V4_0__person2_pos_support.sql
-- Owned by Person 2 (CASHIER Role Lead)

-- Enforce that POS orders always use RETAIL pricing tier
ALTER TABLE orders 
    ADD CONSTRAINT chk_pos_retail_only 
    CHECK (channel != 'POS' OR pricing_tier_used = 'RETAIL');

-- Index for cashier shift reconciliation
CREATE INDEX idx_orders_cashier_shift ON orders(cashier_id, created_at) WHERE channel = 'POS';

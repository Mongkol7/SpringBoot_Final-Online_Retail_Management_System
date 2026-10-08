-- V4_1__person2_pos_shifts.sql
-- Owned by Person 2 (CASHIER Role Lead) - POS Shift Management & Walk-in Schema Alignment

-- Drop NOT NULL from orders.user_id to support anonymous walk-in retail customers at POS
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Create POS Shifts table for drawer reconciliation and float management
CREATE TABLE IF NOT EXISTS pos_shifts (
    id BIGSERIAL PRIMARY KEY,
    cashier_id BIGINT NOT NULL REFERENCES users(id),
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_float NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    closing_cash NUMERIC(12,2),
    system_cash_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cash_variance NUMERIC(12,2),
    total_transactions INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED'
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_pos_shifts_cashier_status ON pos_shifts(cashier_id, status);
CREATE INDEX IF NOT EXISTS idx_pos_shifts_opened ON pos_shifts(opened_at);

-- Ensure CASHIER role exists
INSERT INTO roles (name) VALUES ('CASHIER') ON CONFLICT (name) DO NOTHING;

-- Seed default Cashier user (cashier@retailstore.com / cashier123)
INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT 
    r.id,
    'cashier@retailstore.com',
    '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu',
    'POS Lead Cashier',
    '+1-555-0102',
    'RETAIL',
    TRUE
FROM roles r 
WHERE r.name = 'CASHIER'
ON CONFLICT (email) DO NOTHING;

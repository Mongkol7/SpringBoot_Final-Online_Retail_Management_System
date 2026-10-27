-- V7_0__add_cashier_pos_pin.sql
-- Add POS PIN support to users for cashier staff 2nd-step PIN login

ALTER TABLE users ADD COLUMN IF NOT EXISTS pos_pin VARCHAR(10) DEFAULT '1234';

-- Ensure existing staff/cashiers have defined PINs
UPDATE users SET pos_pin = '1234' WHERE email = 'cashier@retailstore.com';
UPDATE users SET pos_pin = '2026' WHERE email = 'mono@retailstore';
UPDATE users SET pos_pin = '9999' WHERE email = 'admin@retailstore.com';

-- Ensure additional cashier staff exist for multi-cashier terminal operation
INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active, pos_pin)
SELECT 
    r.id,
    'sarah.pos@retailstore.com',
    '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu',
    'Sarah Jenkins (Cashier)',
    '+1-555-0301',
    'RETAIL',
    TRUE,
    '2233'
FROM roles r 
WHERE r.name = 'CASHIER'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active, pos_pin)
SELECT 
    r.id,
    'david.pos@retailstore.com',
    '$2a$12$JYnFq9zAgh/wfHz00Cyp.OM5j75Zj.W1Xt.efIbA9WnwZvwdt2.Qu',
    'David Miller (Cashier)',
    '+1-555-0302',
    'RETAIL',
    TRUE,
    '4455'
FROM roles r 
WHERE r.name = 'CASHIER'
ON CONFLICT (email) DO NOTHING;

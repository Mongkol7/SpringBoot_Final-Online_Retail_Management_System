-- V5_0__initial_seeds.sql
-- Seed the 4 core system roles and initial administrator account

INSERT INTO roles (name) VALUES 
    ('USER'),
    ('CASHIER'),
    ('STOCK_CONTROLLER'),
    ('ADMIN')
ON CONFLICT (name) DO NOTHING;

-- Seed default Administrator account (password: admin123, BCrypt encoded)
-- Hash: $2a$12$e8YIvdC2W8R7yXbXjX7mIe1lJj5M7e3uE6U1J3m9c4qQ8y6qR4m.q (admin123)
INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT 
    r.id,
    'admin@retailstore.com',
    '$2a$12$n4SIUurklIhoZFqQhbjWwesUPLygzKf/RP17VCsJBgkVatYA2Iy6W',
    'System Administrator',
    '+1-555-0100',
    'RETAIL',
    TRUE
FROM roles r 
WHERE r.name = 'ADMIN'
ON CONFLICT (email) DO NOTHING;

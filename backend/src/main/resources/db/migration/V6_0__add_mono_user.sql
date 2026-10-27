-- V6_0__add_mono_user.sql
-- Add new user: Mono

INSERT INTO users (role_id, email, password_hash, full_name, phone, customer_type, is_active)
SELECT 
    4,
    'mono@retailstore',
    '$2b$12$qJBEHO3ki94tXcDQkzmG/eO0n2c20d9h/ljd9FDfIFIz6zIVdPCXG',
    'Mono',
    '0969242603',
    'RETAIL',
    TRUE
ON CONFLICT (email) DO NOTHING;

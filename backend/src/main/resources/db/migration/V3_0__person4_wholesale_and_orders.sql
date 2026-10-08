-- V3_0__person4_wholesale_and_orders.sql
-- Integrates Wholesale Applications & Orders (Shared between Person 1, 2, 4)

CREATE TABLE IF NOT EXISTS wholesale_applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    business_name VARCHAR(150) NOT NULL,
    tax_id_or_license VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(60) UNIQUE NOT NULL,
    channel VARCHAR(20) NOT NULL, -- 'ONLINE' or 'POS'
    user_id BIGINT NOT NULL REFERENCES users(id),
    cashier_id BIGINT REFERENCES users(id), -- NULL for ONLINE orders, Staff ID for POS
    shipping_address TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
    payment_method VARCHAR(30) NOT NULL, -- 'CARD', 'BANK_TRANSFER', 'CASH'
    pricing_tier_used VARCHAR(20) NOT NULL, -- 'RETAIL' or 'WHOLESALE'
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS order_item_batch_fulfillments (
    id BIGSERIAL PRIMARY KEY,
    order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    batch_id BIGINT NOT NULL REFERENCES product_batches(id),
    quantity_deducted INT NOT NULL CHECK (quantity_deducted > 0)
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_channel ON orders(channel);
CREATE INDEX idx_orders_created ON orders(created_at);

-- V2_0__person3_catalog_and_batches.sql
-- Owned by Person 3 (STOCK_CONTROLLER Role Lead)

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id),
    sku VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    cost_price NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0),
    retail_price NUMERIC(12,2) NOT NULL CHECK (retail_price >= cost_price),
    wholesale_price NUMERIC(12,2) NOT NULL CHECK (wholesale_price >= cost_price),
    min_stock_threshold INT NOT NULL DEFAULT 10,
    is_perishable BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_batches (
    id BIGSERIAL PRIMARY KEY,
    batch_code VARCHAR(100) UNIQUE NOT NULL,
    product_id BIGINT NOT NULL REFERENCES products(id),
    supplier_id INT NOT NULL REFERENCES suppliers(id),
    initial_quantity INT NOT NULL CHECK (initial_quantity >= 0),
    current_quantity INT NOT NULL CHECK (current_quantity >= 0),
    expiry_date DATE,
    is_expired BOOLEAN NOT NULL DEFAULT FALSE,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES product_batches(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(40) NOT NULL, -- 'STOCK_IN', 'ONLINE_SALE', 'POS_SALE', 'MANUAL_ADJUSTMENT', 'EXPIRED_WRITE_OFF'
    quantity_delta INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_batches_product_status ON product_batches(product_id, is_expired, current_quantity);
CREATE INDEX idx_batches_expiry ON product_batches(expiry_date);

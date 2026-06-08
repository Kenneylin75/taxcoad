-- ==============================================================================
-- 宮廟 SaaS 系統 PostgreSQL 資料庫建表語法 (Database Schema)
-- ==============================================================================

-- 1. 租戶與經銷商管理層 (SaaS Core)
CREATE TABLE IF NOT EXISTS db_price_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    monthly_price NUMERIC,
    annual_price NUMERIC,
    features JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_distributors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    contact_name VARCHAR(100),
    contact_phone VARCHAR(50),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_dist_sales (
    id VARCHAR(50) PRIMARY KEY,
    distributor_id VARCHAR(50) REFERENCES db_distributors(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_temples (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    distributor_id VARCHAR(50) REFERENCES db_distributors(id),
    sales_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    plan_id VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 宮廟業務層 (Temple Operations)
CREATE TABLE IF NOT EXISTS db_services (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    name VARCHAR(100) NOT NULL,
    price NUMERIC DEFAULT 0,
    duration VARCHAR(50),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    linked_form_id VARCHAR(50),
    linked_print_template_id VARCHAR(50),
    assigned_staff JSONB,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_forms (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    name VARCHAR(100) NOT NULL,
    fields JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_print_templates (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    name VARCHAR(100) NOT NULL,
    temple_name VARCHAR(100),
    watermark_url TEXT,
    watermark_opacity NUMERIC,
    border_style TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_personnel (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50),
    account VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    phone VARCHAR(50),
    permissions JSONB,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_lamp_categories (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    name VARCHAR(100) NOT NULL,
    price NUMERIC DEFAULT 0,
    duration_days INTEGER DEFAULT 365,
    total_slots INTEGER DEFAULT 500,
    description TEXT,
    precautions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_events (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    title VARCHAR(200) NOT NULL,
    date VARCHAR(50),
    location VARCHAR(200),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    banner_url TEXT,
    fields JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 信眾端數據層 (Believer Data)
CREATE TABLE IF NOT EXISTS db_guests (
    phone VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_lamp_records (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    category_id VARCHAR(50) REFERENCES db_lamp_categories(id),
    category_name VARCHAR(100),
    guest_name VARCHAR(100),
    phone VARCHAR(50),
    price NUMERIC,
    status VARCHAR(50) DEFAULT 'Pending',
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    expiry_date VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_event_registrations (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    event_id VARCHAR(50) REFERENCES db_events(id),
    guest_name VARCHAR(100),
    phone VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    registration_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_queue_events (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS db_queue_tickets (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) REFERENCES db_temples(id),
    queue_event_id VARCHAR(50) REFERENCES db_queue_events(id),
    ticket_number VARCHAR(50),
    status VARCHAR(50),
    guest_name VARCHAR(100),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
--  Row Level Security (RLS) 配置範例 (需搭配 db.ts 中 current_temple_id)
-- ==============================================================================
-- ALTER TABLE db_services ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY temple_isolation_policy ON db_services 
--    USING (temple_id = current_setting('app.current_temple_id', true) OR current_setting('app.is_super_admin', true) = 'true');


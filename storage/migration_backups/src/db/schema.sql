-- =========================================================================
-- 🏛️ 雲端宮廟 SaaS 系統 - 生產級 PostgreSQL 實體 Schema 定義與 RLS 安全隔離
-- =========================================================================

-- 啟用 UUID 擴充功能，以支援安全唯一識別碼
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 01. 儲存方案與儲存額度 (SaaS Storage Quota Management)
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS storage_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    size_gb INT NOT NULL UNIQUE,
    price_monthly INT NOT NULL,
    price_yearly INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temples (
    id VARCHAR(50) PRIMARY KEY, -- 例如 'temple-1'
    temple_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Pending', 'Suspended'
    sales_id VARCHAR(50),
    setup_fee INT DEFAULT 12000,
    monthly_rent INT DEFAULT 3600,
    payment_cycle VARCHAR(50) DEFAULT 'Monthly', -- 'Monthly', 'Yearly'
    line_channel_token TEXT,
    line_channel_secret TEXT,
    line_login_client_id TEXT,
    line_push_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temple_storages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    temple_id VARCHAR(50) UNIQUE REFERENCES temples(id) ON DELETE CASCADE,
    used_bytes BIGINT NOT NULL DEFAULT 0,
    allocated_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 預設 5 GB (5 * 1024^3)
    plan_name VARCHAR(100) NOT NULL DEFAULT '標準免費空間',
    city VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 02. 分銷通路與授權體系 (Distributor & Sales Infrastructure)
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS distributors (
    id VARCHAR(50) PRIMARY KEY, -- 例如 'dist-1'
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    owner VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    account VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    custom_price INT NOT NULL DEFAULT 1600000,
    custom_duration INT NOT NULL DEFAULT 2,
    custom_nodes INT NOT NULL DEFAULT 100,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    nodes_used INT DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS distributor_sales (
    id VARCHAR(50) PRIMARY KEY, -- 例如 'sales-1'
    name VARCHAR(255) NOT NULL,
    account VARCHAR(100) NOT NULL UNIQUE,
    distributor_id VARCHAR(50) REFERENCES distributors(id) ON DELETE SET NULL,
    commission_rules JSONB NOT NULL DEFAULT '{"setupFeePercent": 20, "rentYear1Percent": 15, "rentYear2Percent": 10, "rentYear3PlusPercent": 5}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_plans (
    id VARCHAR(50) PRIMARY KEY,
    distributor_id VARCHAR(50) REFERENCES distributors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    setup_fee INT NOT NULL,
    monthly_fee INT NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    free_months INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS temple_applications (
    id VARCHAR(50) PRIMARY KEY,
    temple_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(255),
    plan_id VARCHAR(50) NOT NULL REFERENCES price_plans(id) ON DELETE CASCADE,
    setup_fee INT NOT NULL,
    monthly_fee INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    sales_id VARCHAR(50)
);

-- -------------------------------------------------------------------------
-- 03. 虛擬金流中樞與錢包提領 (Dynamic Payout Hub & Wallets)
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(100) NOT NULL, -- 'SuperAdmin', 'Distributor', 'SuperSales', 'DistributorSales'
    name VARCHAR(255) NOT NULL UNIQUE, -- 如 '超級精英業務', 'sales-1'
    balance INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS withdrawals (
    id VARCHAR(100) PRIMARY KEY, -- 如 'WD-1779186645066'
    sales_name VARCHAR(255) NOT NULL REFERENCES wallets(name) ON DELETE CASCADE,
    amount INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payout_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    temple_name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- '開辦費分潤', '月租提成' 等
    amount INT NOT NULL,
    percentage INT NOT NULL,
    role_name VARCHAR(255) NOT NULL, -- 撥入錢包的擁有者姓名
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 04. 多租戶業務數據 (Multi-Tenant Operating tables with RLS)
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS guests (
    phone VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255),
    address TEXT,
    birthday VARCHAR(50),
    lunar_birthday VARCHAR(255),
    birth_hour VARCHAR(50),
    line_id VARCHAR(255),
    line_user_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) NOT NULL,
    temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price INT NOT NULL DEFAULT 0,
    duration VARCHAR(50) NOT NULL,
    description TEXT,
    assigned_staff INT[] NOT NULL DEFAULT '{}',
    color VARCHAR(50) NOT NULL,
    PRIMARY KEY (id, temple_id)
);

CREATE TABLE IF NOT EXISTS slots (
    id SERIAL,
    temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    staff VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Available', -- 'Available', 'Booked'
    guest_name VARCHAR(255),
    PRIMARY KEY (id, temple_id)
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL,
    temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    staff VARCHAR(100) NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    service VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, temple_id)
);

CREATE TABLE IF NOT EXISTS forms (
    id VARCHAR(50) NOT NULL,
    temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (id, temple_id)
);

CREATE TABLE IF NOT EXISTS personnel (
    id VARCHAR(50) NOT NULL,
    temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    account VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    avatar VARCHAR(255),
    permissions TEXT[],
    PRIMARY KEY (id, temple_id)
);

CREATE TABLE IF NOT EXISTS queue_events (
    id VARCHAR(50) NOT NULL,
    temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_capacity INT NOT NULL,
    service_type VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    start_time VARCHAR(50) NOT NULL,
    end_time VARCHAR(50) NOT NULL,
    PRIMARY KEY (id, temple_id)
);

CREATE TABLE IF NOT EXISTS queue_tickets (
    id VARCHAR(50) NOT NULL,
    temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    event_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Queuing', -- 'Queuing', 'Calling', 'Completed'
    assigned_number VARCHAR(50) NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    actual_order INT NOT NULL,
    scanned_at VARCHAR(50),
    PRIMARY KEY (id, temple_id),
    FOREIGN KEY (event_id, temple_id) REFERENCES queue_events(id, temple_id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------
-- 05. PostgreSQL Row-Level Security (RLS) Policies
-- -------------------------------------------------------------------------

-- 啟用所有業務表格的 RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tickets ENABLE ROW LEVEL SECURITY;

-- 建立多租戶隔離策略 (Isolation Policy)
-- 策略描述：
-- 1. 當 Session 設定 'app.is_super_admin' = 'true' 時，准許 Bypass RLS 以呈現全網與跨宮廟管理面。
-- 2. 對於普通宮廟請求，僅允許讀取/寫入 temple_id 符合 Session 變數 'app.current_temple_id' 的資料行。

CREATE POLICY services_tenant_isolation ON services
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true' 
        OR temple_id = current_setting('app.current_temple_id', true)
    );

CREATE POLICY slots_tenant_isolation ON slots
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true' 
        OR temple_id = current_setting('app.current_temple_id', true)
    );

CREATE POLICY appointments_tenant_isolation ON appointments
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true' 
        OR temple_id = current_setting('app.current_temple_id', true)
    );

CREATE POLICY forms_tenant_isolation ON forms
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true' 
        OR temple_id = current_setting('app.current_temple_id', true)
    );

CREATE POLICY personnel_tenant_isolation ON personnel
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true' 
        OR temple_id = current_setting('app.current_temple_id', true)
    );

CREATE POLICY queue_events_tenant_isolation ON queue_events
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true' 
        OR temple_id = current_setting('app.current_temple_id', true)
    );

CREATE POLICY queue_tickets_tenant_isolation ON queue_tickets
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true' 
        OR temple_id = current_setting('app.current_temple_id', true)
    );

CREATE TABLE IF NOT EXISTS guest_files (
    id VARCHAR(50) NOT NULL,
    temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL REFERENCES guests(phone) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    folder VARCHAR(50) NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, temple_id)
);

ALTER TABLE guest_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY guest_files_tenant_isolation ON guest_files
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true' 
        OR temple_id = current_setting('app.current_temple_id', true)
    );


-- -------------------------------------------------------------------------
-- 06. 帳單與提領 (Billing and Withdrawals)
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS temple_bills (
    id VARCHAR(50) PRIMARY KEY,
    temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Unpaid', -- 'Unpaid', 'Pending', 'Paid'
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bonus_requests (
    id VARCHAR(50) PRIMARY KEY,
    sales_id VARCHAR(50) NOT NULL,
    distributor_id VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    method VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Paid'
    receipt_url TEXT,
    sales_name VARCHAR(255),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id VARCHAR(50) PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    admin_id VARCHAR(50) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'SuperAdmin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

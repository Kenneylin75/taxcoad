-- CreateTable
CREATE TABLE "price_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_price" INTEGER NOT NULL DEFAULT 0,
    "annual_price" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "setupFee" INTEGER NOT NULL DEFAULT 0,
    "monthlyRent" INTEGER NOT NULL DEFAULT 0,
    "paymentCycle" TEXT NOT NULL DEFAULT 'Yearly',
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "email" TEXT,
    "account" TEXT,
    "password" TEXT,
    "address" TEXT,
    "bank_code" TEXT,
    "bank_account" TEXT,
    "bank_name" TEXT,
    "b2b_payment_config" JSONB,
    "quota" INTEGER DEFAULT 100,
    "nodes" INTEGER DEFAULT 100,
    "custom_nodes" INTEGER DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dist_sales" (
    "id" TEXT NOT NULL,
    "distributor_id" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "setupFee" INTEGER NOT NULL DEFAULT 0,
    "monthlyRent" INTEGER NOT NULL DEFAULT 0,
    "paymentCycle" TEXT NOT NULL DEFAULT 'Yearly',
    "role" TEXT,
    "account" TEXT,
    "password" TEXT,
    "bank_account_info" JSONB,
    "commission_rules" JSONB,
    "joined_at" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dist_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "sales_id" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_visits" (
    "id" TEXT NOT NULL,
    "sales_id" TEXT,
    "temple_name" TEXT,
    "sales_name" TEXT,
    "content" TEXT,
    "date" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributor_applications" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "tax_id" TEXT,
    "address" TEXT,
    "plan_id" TEXT,
    "price" INTEGER,
    "nodes" INTEGER,
    "account" TEXT,
    "password" TEXT,
    "expiration_date" TEXT,
    "reject_reason" TEXT,
    "rejected_at" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "submitted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_sales_overrides" (
    "id" TEXT NOT NULL,
    "rule_name" TEXT,
    "override_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_sales_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Temple" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "temple_name" TEXT,
    "account" TEXT,
    "password" TEXT,
    "region" TEXT,
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "setup_fee" INTEGER NOT NULL DEFAULT 0,
    "monthly_rent" INTEGER NOT NULL DEFAULT 0,
    "payment_cycle" TEXT NOT NULL DEFAULT 'Yearly',
    "distributor_id" TEXT,
    "sales_id" TEXT,
    "super_sales_id" TEXT,
    "plan_id" TEXT,
    "theme_color" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "analytics_data" JSONB,
    "guest_settings" JSONB,
    "line_channel_token" TEXT,
    "line_channel_secret" TEXT,
    "line_login_client_id" TEXT,
    "line_push_enabled" BOOLEAN DEFAULT false,
    "form_templates" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Temple_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temple_applications" (
    "id" TEXT NOT NULL,
    "temple_name" TEXT NOT NULL,
    "contact_person" TEXT,
    "contact_phone" TEXT,
    "plan_id" TEXT NOT NULL,
    "setup_fee" INTEGER NOT NULL,
    "monthly_fee" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "sales_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temple_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempleBill" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "type" TEXT,
    "item_name" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Unpaid',
    "due_date" TEXT,
    "billing_date" TEXT,
    "payee_role" TEXT,
    "payee_id" TEXT,
    "timestamp" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TempleBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_plans" (
    "id" TEXT NOT NULL,
    "size_gb" INTEGER NOT NULL,
    "price_monthly" INTEGER NOT NULL,
    "price_yearly" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temple_storages" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "allocated_bytes" BIGINT NOT NULL DEFAULT 5368709120,
    "plan_name" TEXT,
    "city" TEXT,
    "plan_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temple_storages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "account" TEXT,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "temple_id" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "setup_fee" INTEGER NOT NULL DEFAULT 0,
    "monthly_rent" INTEGER NOT NULL DEFAULT 0,
    "payment_cycle" TEXT NOT NULL DEFAULT 'Yearly',
    "permissions" JSONB,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account" TEXT,
    "password" TEXT,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "setupFee" INTEGER NOT NULL DEFAULT 0,
    "monthlyRent" INTEGER NOT NULL DEFAULT 0,
    "paymentCycle" TEXT NOT NULL DEFAULT 'Yearly',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT,
    "admin_name" TEXT,
    "action" TEXT,
    "target" TEXT,
    "details" TEXT,
    "timestamp" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "action" TEXT,
    "details" TEXT,
    "operator" TEXT,
    "timestamp" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "birthday" TEXT,
    "lunar_birthday" TEXT,
    "birth_hour" TEXT,
    "address" TEXT,
    "avatar" TEXT,
    "line_id" TEXT,
    "email" TEXT,
    "password" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "setupFee" INTEGER NOT NULL DEFAULT 0,
    "monthlyRent" INTEGER NOT NULL DEFAULT 0,
    "paymentCycle" TEXT NOT NULL DEFAULT 'Yearly',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_files" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "phone" TEXT,
    "url" TEXT,
    "type" TEXT,
    "name" TEXT,
    "folder" TEXT,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deep_records" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "phone" TEXT,
    "category" TEXT,
    "content" TEXT,
    "date" TEXT,
    "payment_ref" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deep_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "phone" TEXT,
    "type" TEXT,
    "content" TEXT,
    "timestamp" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "duration" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "setupFee" INTEGER NOT NULL DEFAULT 0,
    "monthlyRent" INTEGER NOT NULL DEFAULT 0,
    "paymentCycle" TEXT NOT NULL DEFAULT 'Yearly',
    "assigned_staff" JSONB,
    "color" TEXT,
    "linked_form_id" TEXT,
    "linked_print_template_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_settings" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "push_configs" JSONB,
    "cancel_hours_before" INTEGER,
    "modify_hours_before" INTEGER,
    "allow_cancel" BOOLEAN DEFAULT true,
    "allow_modify" BOOLEAN DEFAULT true,
    "modules" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_templates" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "temple_name" TEXT,
    "watermark_url" TEXT,
    "watermark_opacity" DOUBLE PRECISION,
    "border_style" TEXT,
    "content" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fields" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temple_payment_configs" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "line_pay" JSONB NOT NULL DEFAULT '{}',
    "third_party" JSONB NOT NULL DEFAULT '{}',
    "custom_transfer" JSONB NOT NULL DEFAULT '{}',
    "custom_qr" JSONB NOT NULL DEFAULT '{}',
    "cash" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temple_payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "date" TEXT,
    "time" TEXT,
    "staff" TEXT,
    "description" TEXT,
    "location" TEXT,
    "bound_service_id" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "guest_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "guest_name" TEXT,
    "phone" TEXT,
    "service" TEXT,
    "service_id" TEXT,
    "date" TEXT,
    "time" TEXT,
    "staff" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "payment_method" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'Pending',
    "payment_ref" TEXT,
    "payment_proof_url" TEXT,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lamp_categories" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "duration_days" INTEGER NOT NULL DEFAULT 365,
    "total_slots" INTEGER NOT NULL DEFAULT 500,
    "precautions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lamp_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lamp_records" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "category_id" TEXT,
    "category_name" TEXT,
    "guest_id" TEXT,
    "guest_name" TEXT,
    "phone" TEXT,
    "applicant_name" TEXT,
    "applicant_birth" TEXT,
    "actual_price" INTEGER NOT NULL DEFAULT 0,
    "payment_method" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'Pending',
    "payment_proof_url" TEXT,
    "remarks" TEXT,
    "position" TEXT,
    "start_date" TIMESTAMP(3),
    "duration_days" INTEGER NOT NULL DEFAULT 365,
    "expiry_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lamp_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT,
    "location" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "banner_url" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "fields" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT,
    "event_id" TEXT,
    "guest_id" TEXT,
    "guest_name" TEXT,
    "phone" TEXT,
    "actual_price" INTEGER NOT NULL DEFAULT 0,
    "payment_method" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'Pending',
    "payment_proof_url" TEXT,
    "payment_ref" TEXT,
    "remarks" TEXT,
    "registration_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_events" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "location" TEXT,
    "service_type" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "max_capacity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_tickets" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT,
    "event_id" TEXT,
    "guest_id" TEXT,
    "guest_name" TEXT,
    "phone" TEXT,
    "event_title" TEXT,
    "display_num" TEXT,
    "assigned_number" TEXT,
    "payment_status" TEXT,
    "payment_ref" TEXT,
    "remarks" TEXT,
    "actual_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Queuing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_api_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "version" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_api_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temple_ai_usages" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "query_count" INTEGER NOT NULL DEFAULT 0,
    "month" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "plan_id" TEXT,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expiry_date" TIMESTAMP(3),
    "is_vip" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temple_ai_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queues" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT,
    "action" TEXT,
    "status" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_records" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT,
    "type" TEXT,
    "category" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "date" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "name" TEXT,
    "role" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonus_requests" (
    "id" TEXT NOT NULL,
    "sales_id" TEXT,
    "distributor_id" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "method" TEXT,
    "sales_name" TEXT,
    "receipt_url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributor_withdrawals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "sales_name" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "date" TEXT,
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributor_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "content" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temple_notifications" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "send_time" TIMESTAMP(3) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temple_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "account" TEXT,
    "token" TEXT,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_tools" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "thumbnail" TEXT,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_records" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "staff" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_records" (
    "id" SERIAL NOT NULL,
    "temple_name" TEXT,
    "type" TEXT,
    "amount" DECIMAL(65,30),
    "percentage" DECIMAL(65,30),
    "role_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chat_logs" (
    "id" SERIAL NOT NULL,
    "temple_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "user_query" TEXT NOT NULL,
    "ai_reply" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_orders" (
    "id" TEXT NOT NULL,
    "temple_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Paid',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "temple_storages_temple_id_key" ON "temple_storages"("temple_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "guests_temple_id_phone_key" ON "guests"("temple_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "temple_payment_configs_temple_id_key" ON "temple_payment_configs"("temple_id");

-- AddForeignKey
ALTER TABLE "dist_sales" ADD CONSTRAINT "dist_sales_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "distributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "dist_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_visits" ADD CONSTRAINT "sales_visits_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "dist_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Temple" ADD CONSTRAINT "Temple_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "distributors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Temple" ADD CONSTRAINT "Temple_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "price_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempleBill" ADD CONSTRAINT "TempleBill_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temple_storages" ADD CONSTRAINT "temple_storages_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_files" ADD CONSTRAINT "guest_files_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deep_records" ADD CONSTRAINT "deep_records_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deep_records" ADD CONSTRAINT "deep_records_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_settings" ADD CONSTRAINT "service_settings_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_templates" ADD CONSTRAINT "print_templates_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temple_payment_configs" ADD CONSTRAINT "temple_payment_configs_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_bound_service_id_fkey" FOREIGN KEY ("bound_service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lamp_categories" ADD CONSTRAINT "lamp_categories_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lamp_records" ADD CONSTRAINT "lamp_records_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lamp_records" ADD CONSTRAINT "lamp_records_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "lamp_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lamp_records" ADD CONSTRAINT "lamp_records_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_events" ADD CONSTRAINT "queue_events_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "queue_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temple_ai_usages" ADD CONSTRAINT "temple_ai_usages_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queues" ADD CONSTRAINT "sync_queues_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_records" ADD CONSTRAINT "finance_records_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temple_notifications" ADD CONSTRAINT "temple_notifications_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temple_notifications" ADD CONSTRAINT "temple_notifications_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_records" ADD CONSTRAINT "leave_records_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_logs" ADD CONSTRAINT "ai_chat_logs_temple_id_fkey" FOREIGN KEY ("temple_id") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

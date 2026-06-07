-- ============================================================
-- GVC AGRO FINANCE MANAGEMENT SYSTEM
-- Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SEQUENCE HELPERS FOR HUMAN-READABLE IDs
-- ============================================================

-- Sequence for each entity type
CREATE SEQUENCE IF NOT EXISTS customer_seq START 1;
CREATE SEQUENCE IF NOT EXISTS loan_seq START 1;
CREATE SEQUENCE IF NOT EXISTS payment_seq START 1;
CREATE SEQUENCE IF NOT EXISTS savings_seq START 1;
CREATE SEQUENCE IF NOT EXISTS savings_tx_seq START 1;
CREATE SEQUENCE IF NOT EXISTS user_seq START 1;
CREATE SEQUENCE IF NOT EXISTS report_seq START 1;

-- Function to generate prefixed human-readable IDs
CREATE OR REPLACE FUNCTION generate_entity_id(prefix TEXT, seq_name TEXT)
RETURNS TEXT AS $$
DECLARE
  seq_val BIGINT;
  date_part TEXT;
BEGIN
  seq_val := nextval(seq_name);
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  RETURN prefix || '-' || date_part || '-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_code TEXT UNIQUE NOT NULL DEFAULT generate_entity_id('USR', 'user_seq'),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'branch_manager', 'admin', 'cashier', 'staff', 'view_only')),
  mobile TEXT,
  address TEXT,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_user_code ON users(user_code);

-- ============================================================
-- CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_code TEXT UNIQUE NOT NULL DEFAULT generate_entity_id('CUS', 'customer_seq'),
  full_name TEXT NOT NULL,
  nic_number TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  occupation TEXT,
  monthly_income NUMERIC(15,2),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  photo_url TEXT,
  nic_front_url TEXT,
  nic_back_url TEXT,
  home_photo_url TEXT,
  shop_photo_url TEXT,
  application_form_url TEXT,
  registered_by_staff_id UUID REFERENCES users(id),
  assigned_staff_id UUID REFERENCES users(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_customers_nic ON customers(nic_number);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers USING gin(to_tsvector('english', full_name));

-- ============================================================
-- LOANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_code TEXT UNIQUE NOT NULL DEFAULT generate_entity_id('LON', 'loan_seq'),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  applied_by UUID REFERENCES users(id),
  in_charge_user_id UUID REFERENCES users(id),
  approval_status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (approval_status IN ('pending_approval', 'pending_manager_review', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  loan_form_url TEXT,
  loan_application_url TEXT,
  
  -- Loan terms
  principal_amount NUMERIC(15,2) NOT NULL,
  interest_rate NUMERIC(8,4) NOT NULL,        -- e.g., 2.5 = 2.5%
  interest_type TEXT NOT NULL CHECK (interest_type IN ('daily', 'monthly')),
  duration_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Calculated fields
  total_interest NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_payable NUMERIC(15,2) NOT NULL DEFAULT 0,
  installment_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Tracking
  amount_paid NUMERIC(15,2) DEFAULT 0,
  remaining_balance NUMERIC(15,2) NOT NULL,
  late_fees NUMERIC(15,2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending_approval', 'active', 'closed', 'overdue', 'restructured')),
  is_fully_paid BOOLEAN DEFAULT FALSE,
  last_payment_date DATE,
  next_due_date DATE,
  
  -- Notes
  purpose TEXT,
  guarantor_name TEXT,
  guarantor_phone TEXT,
  collateral_notes TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_code ON loans(loan_code);
CREATE INDEX IF NOT EXISTS idx_loans_next_due ON loans(next_due_date);

-- ============================================================
-- LOAN INSTALLMENT SCHEDULE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  interest_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  installment_amount NUMERIC(15,2) NOT NULL,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue')),
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_loan ON loan_schedule(loan_id);
CREATE INDEX IF NOT EXISTS idx_schedule_due ON loan_schedule(due_date);
CREATE INDEX IF NOT EXISTS idx_schedule_status ON loan_schedule(status);

-- ============================================================
-- LOAN PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_code TEXT UNIQUE NOT NULL DEFAULT generate_entity_id('PAY', 'payment_seq'),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(15,2) NOT NULL,
  principal_paid NUMERIC(15,2) DEFAULT 0,
  interest_paid NUMERIC(15,2) DEFAULT 0,
  late_fee_paid NUMERIC(15,2) DEFAULT 0,
  
  payment_type TEXT NOT NULL CHECK (payment_type IN ('regular', 'partial', 'full_settlement', 'advance')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'mobile')),
  reference_number TEXT,
  
  notes TEXT,
  receipt_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_loan ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON loan_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON loan_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_code ON loan_payments(payment_code);

-- ============================================================
-- SAVINGS ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_code TEXT UNIQUE NOT NULL DEFAULT generate_entity_id('SAV', 'savings_seq'),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  account_type TEXT NOT NULL DEFAULT 'regular' CHECK (account_type IN ('regular', 'fixed', 'recurring')),
  interest_rate NUMERIC(8,4) DEFAULT 0,       -- Annual interest rate %
  interest_frequency TEXT DEFAULT 'monthly' CHECK (interest_frequency IN ('daily', 'monthly', 'yearly')),
  
  balance NUMERIC(15,2) DEFAULT 0,
  total_deposited NUMERIC(15,2) DEFAULT 0,
  total_withdrawn NUMERIC(15,2) DEFAULT 0,
  total_interest_earned NUMERIC(15,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  minimum_balance NUMERIC(15,2) DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_savings_customer ON savings_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_savings_code ON savings_accounts(account_code);

-- ============================================================
-- SAVINGS TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_code TEXT UNIQUE NOT NULL DEFAULT generate_entity_id('STX', 'savings_tx_seq'),
  account_id UUID NOT NULL REFERENCES savings_accounts(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'interest', 'fee')),
  amount NUMERIC(15,2) NOT NULL,
  balance_after NUMERIC(15,2) NOT NULL,
  
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'mobile')),
  reference_number TEXT,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_savings_tx_account ON savings_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_savings_tx_date ON savings_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_savings_tx_type ON savings_transactions(transaction_type);

-- ============================================================
-- DUE REMINDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS due_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  
  due_date DATE NOT NULL,
  amount_due NUMERIC(15,2) NOT NULL,
  reminder_type TEXT DEFAULT 'installment' CHECK (reminder_type IN ('installment', 'overdue', 'final_notice')),
  
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  send_method TEXT DEFAULT 'sms' CHECK (send_method IN ('sms', 'email', 'both')),
  
  is_dismissed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON due_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_customer ON due_reminders(customer_id);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_code TEXT UNIQUE NOT NULL DEFAULT generate_entity_id('RPT', 'report_seq'),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily_collection', 'monthly_finance', 'loan_summary', 'savings_summary', 'customer_wise', 'income', 'due_payment')),
  report_name TEXT NOT NULL,
  
  period_start DATE,
  period_end DATE,
  parameters JSONB DEFAULT '{}',
  data JSONB DEFAULT '{}',
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated ON reports(generated_at);

-- ============================================================
-- ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  user_role TEXT,
  branch_id UUID REFERENCES branches(id),
  
  action TEXT NOT NULL,                   -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', etc.
  entity_type TEXT NOT NULL,              -- 'customer', 'loan', 'payment', 'savings', 'user'
  entity_id TEXT,                         -- The ID of the affected record
  entity_code TEXT,                       -- Human-readable code
  record_type TEXT,
  record_id UUID,
  
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);

-- ============================================================
-- COMPANY SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT DEFAULT 'GVC Agro Finance',
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_logo_url TEXT,
  currency TEXT DEFAULT 'LKR',
  currency_symbol TEXT DEFAULT '₨',
  default_loan_interest_rate NUMERIC(8,4) DEFAULT 2.5,
  default_savings_interest_rate NUMERIC(8,4) DEFAULT 6.0,
  late_fee_percentage NUMERIC(8,4) DEFAULT 2.0,
  grace_period_days INTEGER DEFAULT 3,
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT FALSE,
  sms_provider TEXT,
  email_provider TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default settings
INSERT INTO company_settings (company_name, currency, currency_symbol) 
VALUES ('GVC Agro Finance', 'LKR', '₨')
ON CONFLICT DO NOTHING;

-- ============================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================

-- Update `updated_at` automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_savings_updated_at BEFORE UPDATE ON savings_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VIEWS FOR REPORTS
-- ============================================================

-- Overdue loans view
CREATE OR REPLACE VIEW v_overdue_loans AS
SELECT 
  l.id,
  l.loan_code,
  l.customer_id,
  c.full_name AS customer_name,
  c.phone AS customer_phone,
  l.principal_amount,
  l.remaining_balance,
  l.next_due_date,
  (CURRENT_DATE - l.next_due_date) AS days_overdue,
  l.late_fees
FROM loans l
JOIN customers c ON l.customer_id = c.id
WHERE l.status IN ('active', 'overdue')
  AND l.next_due_date < CURRENT_DATE
  AND l.is_fully_paid = FALSE;

-- Today's due payments view
CREATE OR REPLACE VIEW v_today_dues AS
SELECT 
  ls.id AS schedule_id,
  ls.loan_id,
  l.loan_code,
  l.customer_id,
  c.full_name AS customer_name,
  c.phone AS customer_phone,
  ls.due_date,
  ls.installment_amount,
  ls.paid_amount,
  (ls.installment_amount - ls.paid_amount) AS balance_due,
  ls.status,
  ls.installment_number
FROM loan_schedule ls
JOIN loans l ON ls.loan_id = l.id
JOIN customers c ON l.customer_id = c.id
WHERE ls.due_date = CURRENT_DATE
  AND ls.status IN ('pending', 'partial', 'overdue');

-- Dashboard summary view
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM loans WHERE status = 'active') AS active_loans,
  (SELECT COUNT(*) FROM loans WHERE status = 'overdue') AS overdue_loans,
  (SELECT COALESCE(SUM(balance), 0) FROM savings_accounts WHERE is_active = TRUE) AS total_savings,
  (SELECT COALESCE(SUM(remaining_balance), 0) FROM loans WHERE status IN ('active', 'overdue')) AS total_outstanding,
  (SELECT COALESCE(SUM(amount), 0) FROM loan_payments WHERE payment_date = CURRENT_DATE) AS today_collections,
  (SELECT COUNT(*) FROM customers WHERE is_active = TRUE) AS total_customers,
  (SELECT COALESCE(SUM(amount), 0) FROM loan_payments 
   WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE)) AS monthly_collections;

-- ============================================================
-- COMPLETE SQL FOR FINANCE MANAGEMENT SYSTEM
-- GVC AGRO FINANCE - COMPLETE DATABASE SETUP
-- Run this complete script on your database
-- ============================================================

-- ============================================================
-- PART 1: BRANCHES TABLE (MUST EXIST FIRST)
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code text UNIQUE NOT NULL,
    branch_name text NOT NULL,
    address text,
    phone text,
    email text,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- PART 2: COMPLETE MIGRATION 011 - BRANCH ROLE SYSTEM
-- ============================================================

-- 1. Ensure branches table has status field
ALTER TABLE branches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 2. Ensure single active branch manager per branch
DROP INDEX IF EXISTS uniq_branch_manager_per_branch;
CREATE UNIQUE INDEX uniq_branch_manager_per_branch ON users (branch_id)
WHERE role = 'branch_manager' AND is_active = true;

-- 3. Enhance Activity Logs
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS action_type TEXT;

-- 4. Update loans table - approval workflow
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_approval_status_check;
ALTER TABLE loans ADD CONSTRAINT loans_approval_status_check 
CHECK (approval_status IN (
  'pending_manager_review',
  'pending_owner_approval',
  'approved',
  'rejected',
  'pending_approval'
));

-- Add manager review fields
ALTER TABLE loans ADD COLUMN IF NOT EXISTS manager_review_notes TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS manager_reviewed_at TIMESTAMPTZ;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS manager_reviewed_by UUID REFERENCES users(id);

-- 5. Create customer_documents table for face detection
CREATE TABLE IF NOT EXISTS customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL CHECK (document_type IN ('face_photo', 'nic_front', 'nic_back')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Face detection fields
  face_detected BOOLEAN DEFAULT FALSE,
  face_count INTEGER DEFAULT 0,
  face_quality_score NUMERIC(3, 2),
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_customer ON customer_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_branch ON customer_documents(branch_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type ON customer_documents(document_type);

-- 6. Function to ensure only one active Branch Manager per branch
CREATE OR REPLACE FUNCTION validate_branch_manager()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'branch_manager' AND NEW.is_active = TRUE THEN
    IF EXISTS (
      SELECT 1 FROM users 
      WHERE branch_id = NEW.branch_id 
      AND role = 'branch_manager' 
      AND is_active = TRUE 
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Branch can only have one active Branch Manager';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_branch_manager ON users;
CREATE TRIGGER trg_validate_branch_manager
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION validate_branch_manager();

-- 7. Function to enforce branch requirement for non-owner users
CREATE OR REPLACE FUNCTION validate_user_branch_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != 'owner' THEN
    IF NEW.branch_id IS NULL THEN
      RAISE EXCEPTION 'Non-owner users must be assigned to a branch';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_user_branch ON users;
CREATE TRIGGER trg_validate_user_branch
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION validate_user_branch_assignment();

-- 8. Function to auto-populate branch_id from customer
CREATE OR REPLACE FUNCTION auto_set_branch_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.branch_id IS NULL AND EXISTS (
    SELECT 1 FROM customers WHERE id = NEW.customer_id
  ) THEN
    SELECT branch_id INTO NEW.branch_id FROM customers WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_set_branch_loans ON loans;
CREATE TRIGGER trg_auto_set_branch_loans
BEFORE INSERT ON loans
FOR EACH ROW EXECUTE FUNCTION auto_set_branch_id();

DROP TRIGGER IF EXISTS trg_auto_set_branch_savings ON savings_accounts;
CREATE TRIGGER trg_auto_set_branch_savings
BEFORE INSERT ON savings_accounts
FOR EACH ROW EXECUTE FUNCTION auto_set_branch_id();

-- 9. Activity logging function
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_user_name TEXT,
  p_user_role TEXT,
  p_branch_id UUID,
  p_action TEXT,
  p_record_type TEXT,
  p_record_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    user_id, user_name, user_role, branch_id, action, record_type, record_id
  ) VALUES (
    p_user_id, p_user_name, p_user_role, p_branch_id, p_action, p_record_type, p_record_id
  )
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PART 3: COMPLETE MIGRATION 012 - DEMO DATA
-- ============================================================

-- Clear existing data before seeding
DELETE FROM activity_logs;
DELETE FROM savings_transactions;
DELETE FROM savings_accounts;
DELETE FROM loan_payments;
DELETE FROM loan_schedule;
DELETE FROM loans;
DELETE FROM customer_documents;
DELETE FROM customers;
DELETE FROM users WHERE role != 'service_role';
DELETE FROM branches WHERE branch_code NOT IN ('DEFAULT');

-- 1. CREATE BRANCHES
INSERT INTO branches (id, branch_code, branch_name, address, phone, email, status) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'AMPARA', 'Ampara Branch', 'Main Street, Ampara', '+94654223456', 'ampara@gvcagro.lk', 'active'),
  ('b2222222-2222-2222-2222-222222222222', 'KALMUNAI', 'Kalmunai Branch', 'Bazaar Road, Kalmunai', '+94654323456', 'kalmunai@gvcagro.lk', 'active'),
  ('b3333333-3333-3333-3333-333333333333', 'BATTICALOA', 'Batticaloa Branch', 'Main Road, Batticaloa', '+94654423456', 'batticaloa@gvcagro.lk', 'active'),
  ('b4444444-4444-4444-4444-444444444444', 'AKKARAIPATTU', 'Akkaraipattu Branch', 'Central Road, Akkaraipattu', '+94654523456', 'akkaraipattu@gvcagro.lk', 'active');

-- 2. CREATE OWNER USER (password: GvcAdmin@2026 - bcrypt hashed)
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'USR-20260607-0001',
  'owner@gvcagro.lk',
  '$2a$10$qr4P649/kwgTRtdZLgbNKu1zfrx5mfVpUohLb7mrtEKuWkwdlJb8G',
  'Owner Admin',
  'owner',
  '+94771234567',
  'Head Office, Colombo, Sri Lanka',
  TRUE
);

-- 3. CREATE BRANCH MANAGERS (ONE PER BRANCH)
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, branch_id, is_active, created_by
) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'USR-20260607-0002', 'manager.ampara@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Manager Ampara', 'branch_manager', '+94771111111', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a0000000-0000-0000-0000-000000000001'),
  ('a2222222-2222-2222-2222-222222222222', 'USR-20260607-0003', 'manager.kalmunai@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Manager Kalmunai', 'branch_manager', '+94772222222', 'Kalmunai', 'b2222222-2222-2222-2222-222222222222', TRUE, 'a0000000-0000-0000-0000-000000000001'),
  ('a3333333-3333-3333-3333-333333333333', 'USR-20260607-0004', 'manager.batticaloa@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Manager Batticaloa', 'branch_manager', '+94773333333', 'Batticaloa', 'b3333333-3333-3333-3333-333333333333', TRUE, 'a0000000-0000-0000-0000-000000000001'),
  ('a4444444-4444-4444-4444-444444444444', 'USR-20260607-0005', 'manager.akkaraipattu@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Manager Akkaraipattu', 'branch_manager', '+94774444444', 'Akkaraipattu', 'b4444444-4444-4444-4444-444444444444', TRUE, 'a0000000-0000-0000-0000-000000000001');

-- 4. CREATE ADMINS (ONE PER BRANCH)
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, branch_id, is_active, created_by
) VALUES
  ('a5555555-5555-5555-5555-555555555551', 'USR-20260607-0010', 'admin.ampara@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Admin Ampara', 'admin', '+94781111111', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a1111111-1111-1111-1111-111111111111'),
  ('a5555555-5555-5555-5555-555555555552', 'USR-20260607-0011', 'admin.kalmunai@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Admin Kalmunai', 'admin', '+94782222222', 'Kalmunai', 'b2222222-2222-2222-2222-222222222222', TRUE, 'a2222222-2222-2222-2222-222222222222');

-- 5. CREATE CASHIERS
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, branch_id, is_active, created_by
) VALUES
  ('a6666666-6666-6666-6666-666666666661', 'USR-20260607-0020', 'cashier.ampara@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Cashier Ampara', 'cashier', '+94791111111', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a1111111-1111-1111-1111-111111111111');

-- 6. CREATE STAFF (COLLECTION OFFICERS)
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, branch_id, is_active, created_by
) VALUES
  ('a7777777-7777-7777-7777-777777777771', 'USR-20260607-0030', 'staff.ampara1@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Officer Ampara 1', 'staff', '+94771111117', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a1111111-1111-1111-1111-111111111111'),
  ('a7777777-7777-7777-7777-777777777772', 'USR-20260607-0031', 'staff.ampara2@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Officer Ampara 2', 'staff', '+94771111118', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a1111111-1111-1111-1111-111111111111'),
  ('a7777777-7777-7777-7777-777777777773', 'USR-20260607-0032', 'staff.kalmunai1@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Officer Kalmunai 1', 'staff', '+94772222227', 'Kalmunai', 'b2222222-2222-2222-2222-222222222222', TRUE, 'a2222222-2222-2222-2222-222222222222');

-- 7. CREATE DEMO CUSTOMERS (in branches)
INSERT INTO customers (
  id, customer_code, full_name, nic_number, phone, email, address, date_of_birth, gender, occupation, monthly_income, branch_id, is_active, created_by
) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'CUS-20260607-0001', 'Raj Kumar', '200123456789', '+94771111120', 'raj@example.com', 'Ampara Street 1', '1980-01-15', 'male', 'Business Owner', 50000, 'b1111111-1111-1111-1111-111111111111', TRUE, 'a5555555-5555-5555-5555-555555555551'),
  ('c2222222-2222-2222-2222-222222222222', 'CUS-20260607-0002', 'Lakshmi Priya', '200234567890', '+94771111121', 'lakshmi@example.com', 'Ampara Street 2', '1985-03-20', 'female', 'Shop Owner', 45000, 'b1111111-1111-1111-1111-111111111111', TRUE, 'a5555555-5555-5555-5555-555555555551');

-- ============================================================
-- SUMMARY OF DEFAULT CREDENTIALS
-- ============================================================
-- Owner: owner@gvcagro.lk / Password@2026
-- Manager (Ampara): manager.ampara@gvcagro.lk / Password@2026
-- Admin (Ampara): admin.ampara@gvcagro.lk / Password@2026
-- Cashier (Ampara): cashier.ampara@gvcagro.lk / Password@2026
-- Staff 1 (Ampara): staff.ampara1@gvcagro.lk / Password@2026
-- Staff 2 (Ampara): staff.ampara2@gvcagro.lk / Password@2026

-- ============================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================
-- SELECT 'Branches' as table_name, COUNT(*) as count FROM branches
-- UNION ALL
-- SELECT 'Users', COUNT(*) FROM users
-- UNION ALL
-- SELECT 'Customers', COUNT(*) FROM customers;

-- SELECT branch_name, COUNT(*) as user_count FROM users u
-- JOIN branches b ON u.branch_id = b.id
-- GROUP BY branch_name;

-- SELECT 'Branch Managers per branch:' as check_name;
-- SELECT b.branch_name, u.full_name, u.email FROM users u
-- JOIN branches b ON u.branch_id = b.id
-- WHERE u.role = 'branch_manager' AND u.is_active = true;

-- ============================================================
-- END OF COMPLETE SQL SCRIPT
-- ============================================================

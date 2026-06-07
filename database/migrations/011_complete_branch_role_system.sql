-- 011_complete_branch_role_system.sql
-- Complete migration for Finance Management System with full branch & role structure

-- ============================================================
-- 1. Update branches table with status field
-- ============================================================
ALTER TABLE branches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- ============================================================
-- 2. Update users table - ensure branch requirements
-- ============================================================
-- Verify branch constraints (should be from migration 006)
-- Owner: branch_id IS NULL
-- Others: branch_id IS NOT NULL

-- ============================================================
-- 3. Ensure single active branch manager per branch
-- ============================================================
-- This UNIQUE index already exists from migration 006
-- Recreate to ensure it's correct
DROP INDEX IF EXISTS uniq_branch_manager_per_branch;
CREATE UNIQUE INDEX uniq_branch_manager_per_branch ON users (branch_id)
WHERE role = 'branch_manager' AND is_active = true;

-- ============================================================
-- 4. Activity Logs - Enhanced
-- ============================================================
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS action_type TEXT;
-- These columns should already exist from migration 006:
-- branch_id, record_type, record_id

-- ============================================================
-- 5. Update loans table - approval workflow
-- ============================================================
-- Ensure approval_status has all required states
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_approval_status_check;
ALTER TABLE loans ADD CONSTRAINT loans_approval_status_check 
CHECK (approval_status IN (
  'pending_manager_review',
  'pending_owner_approval',
  'approved',
  'rejected',
  'pending_approval'
));

-- Add manager_review_notes column
ALTER TABLE loans ADD COLUMN IF NOT EXISTS manager_review_notes TEXT;

-- Add manager_reviewed_at timestamp
ALTER TABLE loans ADD COLUMN IF NOT EXISTS manager_reviewed_at TIMESTAMPTZ;

-- Add manager_reviewed_by (user who reviewed)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS manager_reviewed_by UUID REFERENCES users(id);

-- ============================================================
-- 6. Documents table for customer face detection validation
-- ============================================================
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
  face_quality_score NUMERIC(3, 2),  -- 0.0 to 1.0
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_customer ON customer_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_branch ON customer_documents(branch_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type ON customer_documents(document_type);

-- ============================================================
-- 7. Branch data isolation - ensure all tables have branch_id
-- ============================================================
-- Verify all core tables have branch_id and are properly indexed
-- (Should already exist from migration 006)

-- ============================================================
-- 8. Function to ensure only one active Branch Manager per branch
-- ============================================================
CREATE OR REPLACE FUNCTION validate_branch_manager()
RETURNS TRIGGER AS $$
BEGIN
  -- If promoting someone to branch_manager
  IF NEW.role = 'branch_manager' AND NEW.is_active = TRUE THEN
    -- Check if there's already an active branch manager for this branch
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

-- ============================================================
-- 9. Function to enforce branch requirement for non-owner users
-- ============================================================
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

-- ============================================================
-- 10. Function to auto-populate branch_id from customer
-- ============================================================
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

-- ============================================================
-- 11. Activity logging function
-- ============================================================
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

-- End of migration 011

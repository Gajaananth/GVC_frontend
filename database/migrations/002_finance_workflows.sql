-- Migration: Sri Lanka finance workflows
-- Run after schema.sql in Supabase SQL Editor

-- Customer document fields (scanned forms, premises photos)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS home_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS shop_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS application_form_url TEXT,
  ADD COLUMN IF NOT EXISTS registered_by_staff_id UUID REFERENCES users(id);

-- Customer documents (multiple uploads per type)
CREATE TABLE IF NOT EXISTS customer_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'nic_front', 'nic_back', 'photo', 'application_form',
    'home_photo', 'shop_photo', 'other'
  )),
  file_url TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_customer ON customer_documents(customer_id);

-- Loan staff tracking & owner approval
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS applied_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS in_charge_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending_approval'
    CHECK (approval_status IN ('pending_approval', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Existing active loans: mark as approved
UPDATE loans SET approval_status = 'approved' WHERE approval_status = 'pending_approval' AND status IN ('active', 'closed', 'overdue', 'restructured');

-- Allow pending_approval as operational status for new loans before activation
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;
ALTER TABLE loans ADD CONSTRAINT loans_status_check
  CHECK (status IN ('pending_approval', 'active', 'closed', 'overdue', 'restructured'));

-- In-charge change requests (admin proposes, owner approves)
CREATE TABLE IF NOT EXISTS loan_assignment_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  previous_in_charge_id UUID REFERENCES users(id),
  proposed_in_charge_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending_owner'
    CHECK (status IN ('pending_owner', 'approved', 'rejected')),
  requested_by UUID NOT NULL REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_assignment_loan ON loan_assignment_changes(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_assignment_status ON loan_assignment_changes(status);

-- Dashboard: pending owner approvals
CREATE OR REPLACE VIEW v_pending_loan_approvals AS
SELECT
  l.id,
  l.loan_code,
  l.customer_id,
  c.full_name AS customer_name,
  c.nic_number,
  l.principal_amount,
  l.approval_status,
  l.created_at,
  applied.full_name AS applied_by_name,
  incharge.full_name AS in_charge_name
FROM loans l
JOIN customers c ON l.customer_id = c.id
LEFT JOIN users applied ON l.applied_by = applied.id
LEFT JOIN users incharge ON l.in_charge_user_id = incharge.id
WHERE l.approval_status = 'pending_approval';

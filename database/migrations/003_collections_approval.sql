-- Staff collections require admin approval; corrections need owner approval

ALTER TABLE loan_payments
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending_admin', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS online_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE savings_transactions
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending_admin', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS online_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Existing rows stay approved
UPDATE loan_payments SET approval_status = 'approved' WHERE approval_status IS NULL;
UPDATE savings_transactions SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Correction requests (staff letter → owner approves → admin/owner fixes with date change allowed)
CREATE TABLE IF NOT EXISTS collection_correction_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_payment', 'savings_transaction')),
  entity_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('void', 'amend')),
  letter_description TEXT NOT NULL,
  proposed_amount NUMERIC(15,2),
  proposed_cash_amount NUMERIC(15,2),
  proposed_online_amount NUMERIC(15,2),
  proposed_transaction_date DATE,
  status TEXT NOT NULL DEFAULT 'pending_owner'
    CHECK (status IN ('pending_owner', 'approved', 'rejected', 'executed')),
  requested_by UUID NOT NULL REFERENCES users(id),
  owner_reviewed_by UUID REFERENCES users(id),
  owner_reviewed_at TIMESTAMPTZ,
  owner_notes TEXT,
  executed_by UUID REFERENCES users(id),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_correction_status ON collection_correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_correction_entity ON collection_correction_requests(entity_type, entity_id);

-- Daily cash/online reconciliation per staff (admin verifies before approving collections)
CREATE TABLE IF NOT EXISTS staff_daily_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_user_id UUID NOT NULL REFERENCES users(id),
  reconciliation_date DATE NOT NULL,
  declared_cash_total NUMERIC(15,2) NOT NULL,
  declared_online_total NUMERIC(15,2) NOT NULL,
  system_cash_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  system_online_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  admin_notes TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'balanced', 'discrepancy')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_user_id, reconciliation_date)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_staff_date ON staff_daily_reconciliations(staff_user_id, reconciliation_date);

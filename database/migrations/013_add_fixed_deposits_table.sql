-- 013_add_fixed_deposits_table.sql
-- Add Fixed Deposits feature to GVC Finance Management System
-- Include closed_at and block_reason columns

-- ============================================================
-- CREATE FIXED DEPOSITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS fixed_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fd_code TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Deposit terms
  principal_amount NUMERIC(15,2) NOT NULL,
  interest_rate NUMERIC(8,4) NOT NULL,        -- Annual interest rate %
  term_months INTEGER NOT NULL,
  maturity_date DATE NOT NULL,
  
  -- Calculated fields
  total_interest NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_maturity_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'closed', 'blocked')),
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,                          -- Reason for blocking the FD
  blocked_at TIMESTAMPTZ,
  blocked_by UUID REFERENCES users(id),
  
  -- Closure tracking
  closed_at TIMESTAMPTZ,                      -- When the FD was closed
  closed_by UUID REFERENCES users(id),
  payout_amount NUMERIC(15,2),                -- Amount paid out at closure
  closure_reason TEXT,
  
  -- Payout details
  payout_method TEXT DEFAULT 'cash' CHECK (payout_method IN ('cash', 'bank_transfer', 'cheque', 'mobile')),
  
  -- Additional info
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ============================================================
-- CREATE INDEXES FOR FIXED DEPOSITS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_customer ON fixed_deposits(customer_id);
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_branch ON fixed_deposits(branch_id);
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_status ON fixed_deposits(status);
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_maturity ON fixed_deposits(maturity_date);
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_code ON fixed_deposits(fd_code);
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_created ON fixed_deposits(created_at);

-- ============================================================
-- ADD FIXED DEPOSITS TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS fixed_deposit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fd_id UUID NOT NULL REFERENCES fixed_deposits(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'interest', 'closure', 'penalty')),
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_fd_transactions_fd ON fixed_deposit_transactions(fd_id);
CREATE INDEX IF NOT EXISTS idx_fd_transactions_type ON fixed_deposit_transactions(transaction_type);

-- ============================================================
-- UPDATE TRIGGER FOR UPDATED_AT
-- ============================================================
CREATE TRIGGER tr_fixed_deposits_updated_at BEFORE UPDATE ON fixed_deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- HELPER FUNCTION TO GENERATE FD CODE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS fd_seq START 1;

CREATE OR REPLACE FUNCTION generate_fd_code()
RETURNS TEXT AS $$
DECLARE
  seq_val BIGINT;
  date_part TEXT;
BEGIN
  seq_val := nextval('fd_seq');
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  RETURN 'FD-' || date_part || '-' || LPAD(seq_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER TO AUTO-POPULATE FD CODE
-- ============================================================
CREATE OR REPLACE FUNCTION set_fd_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fd_code IS NULL THEN
    NEW.fd_code := generate_fd_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_fd_code ON fixed_deposits;
CREATE TRIGGER trg_set_fd_code BEFORE INSERT ON fixed_deposits
  FOR EACH ROW EXECUTE FUNCTION set_fd_code();

-- ============================================================
-- VIEW FOR ACTIVE FIXED DEPOSITS
-- ============================================================
CREATE OR REPLACE VIEW v_active_fixed_deposits AS
SELECT 
  fd.id,
  fd.fd_code,
  fd.customer_id,
  c.full_name AS customer_name,
  c.phone AS customer_phone,
  fd.principal_amount,
  fd.interest_rate,
  fd.term_months,
  fd.maturity_date,
  fd.total_maturity_amount,
  fd.status,
  fd.is_blocked,
  fd.block_reason,
  fd.created_at
FROM fixed_deposits fd
JOIN customers c ON fd.customer_id = c.id
WHERE fd.status IN ('active', 'blocked')
  AND NOT fd.is_blocked;

-- ============================================================
-- VIEW FOR MATURED FIXED DEPOSITS
-- ============================================================
CREATE OR REPLACE VIEW v_matured_fixed_deposits AS
SELECT 
  fd.id,
  fd.fd_code,
  fd.customer_id,
  c.full_name AS customer_name,
  c.phone AS customer_phone,
  fd.principal_amount,
  fd.interest_rate,
  fd.term_months,
  fd.maturity_date,
  fd.total_maturity_amount,
  fd.status,
  fd.created_at
FROM fixed_deposits fd
JOIN customers c ON fd.customer_id = c.id
WHERE fd.status IN ('matured')
  AND CURRENT_DATE >= fd.maturity_date;

-- ============================================================
-- SAMPLE DATA FOR FIXED DEPOSITS (Optional - comment out if not needed)
-- ============================================================
-- Uncomment below to seed sample fixed deposits data
-- Make sure you have customers table populated first

-- INSERT INTO fixed_deposits (
--   id, fd_code, customer_id, principal_amount, interest_rate, term_months, 
--   maturity_date, total_interest, total_maturity_amount, status, is_blocked, 
--   payout_method, created_by
-- ) VALUES
-- (
--   '14a1648a-e1e0-4132-b69c-424e3920d984',
--   'FD-20260614-00001',
--   'c1111111-1111-1111-1111-111111111111',
--   300000.00, 8.5, 12, '2027-01-15', 30600.00, 330600.00,
--   'active', FALSE, 'bank_transfer',
--   'a0000000-0000-0000-0000-000000000001'
-- ),
-- (
--   'f0000002-0002-0002-0002-000000000002',
--   'FD-20260614-00002',
--   'c2222222-2222-2222-2222-222222222222',
--   500000.00, 9.0, 24, '2028-05-20', 108000.00, 608000.00,
--   'active', FALSE, 'cash',
--   'a5555555-5555-5555-5555-555555555551'
-- );

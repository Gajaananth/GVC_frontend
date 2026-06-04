-- Loan products: repayment frequency, credit date, fees, staff-assigned customers

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES users(id);

UPDATE customers SET assigned_staff_id = registered_by_staff_id
  WHERE assigned_staff_id IS NULL AND registered_by_staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_assigned_staff ON customers(assigned_staff_id);

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS repayment_frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (repayment_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS credit_date DATE,
  ADD COLUMN IF NOT EXISTS first_collection_date DATE,
  ADD COLUMN IF NOT EXISTS gross_loan_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS insurance_fee_percent NUMERIC(8,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_fee_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_fee_fixed NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documentation_fee NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_disbursement NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS term_count INTEGER,
  ADD COLUMN IF NOT EXISTS interest_rate_per_period NUMERIC(8,4);

UPDATE loans SET
  gross_loan_amount = COALESCE(gross_loan_amount, principal_amount),
  credit_date = COALESCE(credit_date, start_date),
  term_count = COALESCE(term_count, duration_months),
  interest_rate_per_period = COALESCE(interest_rate_per_period, interest_rate),
  net_disbursement = COALESCE(net_disbursement, principal_amount)
WHERE gross_loan_amount IS NULL OR credit_date IS NULL;

-- Staff daily collection view helper
CREATE OR REPLACE VIEW v_staff_daily_collections AS
SELECT
  ls.id AS schedule_id,
  ls.loan_id,
  ls.due_date,
  ls.installment_number,
  ls.installment_amount,
  ls.paid_amount,
  (ls.installment_amount - COALESCE(ls.paid_amount, 0)) AS balance_due,
  ls.status AS schedule_status,
  l.loan_code,
  l.repayment_frequency,
  l.in_charge_user_id AS staff_id,
  l.customer_id,
  c.full_name AS customer_name,
  c.phone AS customer_phone,
  c.customer_code,
  c.assigned_staff_id
FROM loan_schedule ls
JOIN loans l ON ls.loan_id = l.id
JOIN customers c ON l.customer_id = c.id
WHERE l.approval_status = 'approved'
  AND l.status IN ('active', 'overdue')
  AND l.is_fully_paid = FALSE
  AND ls.status IN ('pending', 'partial', 'overdue');

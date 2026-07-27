ALTER TABLE loans ADD COLUMN IF NOT EXISTS discount_total NUMERIC(15,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS loan_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('late_fee', 'discount')),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    balance_before NUMERIC(15,2) NOT NULL,
    balance_after NUMERIC(15,2) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_adjustments_loan_id ON loan_adjustments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_adjustments_type ON loan_adjustments(type);

-- Staff hand physical forms to admin; admin enters data and sends to owner

CREATE TABLE IF NOT EXISTS physical_form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  walk_in_full_name TEXT,
  walk_in_nic TEXT,
  walk_in_phone TEXT,
  form_type TEXT NOT NULL CHECK (form_type IN ('new_customer', 'new_loan', 'both', 'other')),
  staff_notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_admin'
    CHECK (status IN ('pending_admin', 'processed', 'cancelled')),
  branch_id UUID NOT NULL REFERENCES branches(id),
  submitted_by UUID NOT NULL REFERENCES users(id),
  processed_by UUID REFERENCES users(id),
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_physical_forms_status ON physical_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_physical_forms_submitted ON physical_form_submissions(submitted_by);

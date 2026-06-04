-- 006_branch_and_isolation.sql
-- Migration to add branch management and data isolation

-- 1. Create branches table
CREATE TABLE branches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code text UNIQUE NOT NULL,
    branch_name text NOT NULL,
    address text,
    phone text,
    email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Add branch_id to users and enforce a branch for all non-owner roles
ALTER TABLE users ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
-- Owner (role = 'owner') may have null branch_id; others must have a branch
-- Add a check constraint for role
ALTER TABLE users ADD CONSTRAINT users_branch_required CHECK (
    (role = 'owner' AND branch_id IS NULL) OR (role <> 'owner' AND branch_id IS NOT NULL)
);

-- 3. Ensure only one active Branch Manager per branch
-- Assume role = 'branch_manager' for manager
CREATE UNIQUE INDEX uniq_branch_manager_per_branch ON users (branch_id)
WHERE role = 'branch_manager' AND is_active = true;

-- 4. Add branch_id to core tables
ALTER TABLE customers ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE loans ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE savings ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE reports ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE CASCADE;

-- 5. Extend activity_logs with branch_id and other fields
ALTER TABLE activity_logs ADD COLUMN branch_id uuid REFERENCES branches(id);
ALTER TABLE activity_logs ADD COLUMN record_type text; -- e.g., 'customer', 'loan', etc.
ALTER TABLE activity_logs ADD COLUMN record_id uuid;

-- 6. Add indexes for branch filtering
CREATE INDEX idx_customers_branch ON customers (branch_id);
CREATE INDEX idx_loans_branch ON loans (branch_id);
CREATE INDEX idx_savings_branch ON savings (branch_id);
CREATE INDEX idx_transactions_branch ON transactions (branch_id);
CREATE INDEX idx_reports_branch ON reports (branch_id);
CREATE INDEX idx_activity_logs_branch ON activity_logs (branch_id);

-- 7. Optional: Add default branch assignment for existing records (assign to a default branch if needed)
-- This step may require creating a default branch and updating existing rows.
-- Create a default branch if not exists
INSERT INTO branches (branch_code, branch_name) VALUES ('DEFAULT', 'Default Branch')
ON CONFLICT (branch_code) DO NOTHING;

-- Get the id of the default branch
WITH default_branch AS (
    SELECT id FROM branches WHERE branch_code = 'DEFAULT'
)
UPDATE users SET branch_id = (SELECT id FROM default_branch) WHERE branch_id IS NULL;
UPDATE customers SET branch_id = (SELECT id FROM default_branch) WHERE branch_id IS NULL;
UPDATE loans SET branch_id = (SELECT id FROM default_branch) WHERE branch_id IS NULL;
UPDATE savings SET branch_id = (SELECT id FROM default_branch) WHERE branch_id IS NULL;
UPDATE transactions SET branch_id = (SELECT id FROM default_branch) WHERE branch_id IS NULL;
UPDATE reports SET branch_id = (SELECT id FROM default_branch) WHERE branch_id IS NULL;
UPDATE activity_logs SET branch_id = (SELECT id FROM default_branch) WHERE branch_id IS NULL;

-- 8. Add trigger to update updated_at for branches
CREATE OR REPLACE FUNCTION update_branch_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_branch_timestamp
BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION update_branch_timestamp();

-- End of migration

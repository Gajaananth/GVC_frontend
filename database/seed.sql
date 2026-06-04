-- ============================================================
-- GVC AGRO FINANCE - SEED DATA
-- ============================================================
-- Run AFTER schema.sql
-- Default owner password: GvcAdmin@2026 (bcrypt hashed)
-- ============================================================

-- Clear existing data before seeding to prevent duplicate key errors
TRUNCATE TABLE activity_logs, savings_transactions, savings_accounts, loan_payments, loans, customers, users CASCADE;

-- Owner user (password: GvcAdmin@2026)
INSERT INTO users (id, user_code, email, password_hash, full_name, role, mobile, address, is_active)
VALUES (
  'a1b2c3d4-0001-0001-0001-000000000001',
  'USR-20260525-0001',
  'owner@gvcagro.lk',
  '$2a$10$qr4P649/kwgTRtdZLgbNKu1zfrx5mfVpUohLb7mrtEKuWkwdlJb8G',
  'Pakkiyanathan Gopiraj',
  'owner',
  '+94771234567',
  '12, Raja Veethi, Jaffna, Sri Lanka',
  TRUE
);

-- Admin user (password: Admin@2026)
INSERT INTO users (id, user_code, email, password_hash, full_name, role, mobile, address, is_active, created_by)
VALUES (
  'a1b2c3d4-0002-0002-0002-000000000002',
  'USR-20260525-0002',
  'admin@gvcagro.lk',
  '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2',
  'Karthikeyan Murugan',
  'admin',
  '+94771234568',
  '45, Kovil Theru, Vavuniya, Sri Lanka',
  TRUE,
  'a1b2c3d4-0001-0001-0001-000000000001'
);

-- Staff user (password: Staff@2026)
INSERT INTO users (id, user_code, email, password_hash, full_name, role, mobile, address, is_active, created_by)
VALUES (
  'a1b2c3d4-0003-0003-0003-000000000003',
  'USR-20260525-0003',
  'staff@gvcagro.lk',
  '$2a$10$NDiWCtgVb5ZoadKk2gLYF.EOfKikJbu22hGk3XLQ1N5lyavHD.JsG',
  'Priya Selvam',
  'staff',
  '+94771234569',
  '78, Nallur Road, Jaffna, Sri Lanka',
  TRUE,
  'a1b2c3d4-0001-0001-0001-000000000001'
);

-- View-only user (password: View@2026)
INSERT INTO users (id, user_code, email, password_hash, full_name, role, mobile, address, is_active, created_by)
VALUES (
  'a1b2c3d4-0004-0004-0004-000000000004',
  'USR-20260525-0004',
  'viewer@gvcagro.lk',
  '$2a$10$utV2t4DM9FHcGOHXYrwRouXuO4yBLTESKci/Z2EeT5bI4S0ca6L1i',
  'Anitha Rajan',
  'view_only',
  '+94771234570',
  '23, Kandy Road, Mannar, Sri Lanka',
  TRUE,
  'a1b2c3d4-0001-0001-0001-000000000001'
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

INSERT INTO customers (id, customer_code, full_name, nic_number, phone, email, address, gender, occupation, monthly_income, notes, created_by)
VALUES
(
  'c0000001-0001-0001-0001-000000000001',
  'CUS-20260525-0001',
  'Suresh Tharmalingam',
  '198534501234',
  '+94712345601',
  'suresh.t@gmail.com',
  '34, Pallai Road, Kilinochchi, Sri Lanka',
  'male',
  'Farmer',
  45000.00,
  'Long-term customer. Reliable payment history.',
  'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'c0000002-0002-0002-0002-000000000002',
  'CUS-20260525-0002',
  'Kavitha Rajagopal',
  '197812305678',
  '+94712345602',
  'kavitha.r@yahoo.com',
  '12, Hospital Road, Vavuniya, Sri Lanka',
  'female',
  'Small Business Owner',
  75000.00,
  'Runs a small grocery store. Applied for business expansion loan.',
  'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'c0000003-0003-0003-0003-000000000003',
  'CUS-20260525-0003',
  'Rajan Sivakumar',
  '199023409876',
  '+94712345603',
  NULL,
  '56, Elephant Pass Road, Jaffna, Sri Lanka',
  'male',
  'Tea Estate Worker',
  35000.00,
  'New customer. First loan application.',
  'a1b2c3d4-0002-0002-0002-000000000002'
),
(
  'c0000004-0004-0004-0004-000000000004',
  'CUS-20260525-0004',
  'Malathi Krishnaswamy',
  '198645678901',
  '+94712345604',
  'malathi.k@gmail.com',
  '89, Navalar Road, Jaffna, Sri Lanka',
  'female',
  'School Teacher',
  55000.00,
  'Government employee. Very reliable.',
  'a1b2c3d4-0002-0002-0002-000000000002'
),
(
  'c0000005-0005-0005-0005-000000000005',
  'CUS-20260525-0005',
  'Thileepan Arunachalam',
  '199156789012',
  '+94712345605',
  'thileepan.a@hotmail.com',
  '23, Chundikuli Road, Jaffna, Sri Lanka',
  'male',
  'Dairy Farmer',
  65000.00,
  'Has existing savings account. Good standing.',
  'a1b2c3d4-0001-0001-0001-000000000001'
);

-- ============================================================
-- LOANS
-- ============================================================

INSERT INTO loans (
  id, loan_code, customer_id,
  principal_amount, interest_rate, interest_type, duration_months,
  start_date, end_date,
  total_interest, total_payable, installment_amount,
  amount_paid, remaining_balance,
  status, next_due_date, purpose,
  created_by
) VALUES
(
  'b0000001-0001-0001-0001-000000000001',
  'LON-20260525-0001',
  'c0000001-0001-0001-0001-000000000001',
  150000.00, 2.5, 'monthly', 12,
  '2026-01-01', '2026-12-31',
  45000.00, 195000.00, 16250.00,
  48750.00, 146250.00,
  'active', '2026-06-01',
  'Agricultural equipment purchase',
  'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'b0000002-0002-0002-0002-000000000002',
  'LON-20260525-0002',
  'c0000002-0002-0002-0002-000000000002',
  250000.00, 2.0, 'monthly', 18,
  '2025-12-01', '2027-05-31',
  90000.00, 340000.00, 18888.89,
  56666.67, 283333.33,
  'active', '2026-06-01',
  'Business expansion - grocery store renovation',
  'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'b0000003-0003-0003-0003-000000000003',
  'LON-20260525-0003',
  'c0000004-0004-0004-0004-000000000004',
  80000.00, 1.5, 'monthly', 6,
  '2025-11-01', '2026-04-30',
  7200.00, 87200.00, 14533.33,
  87200.00, 0.00,
  'closed', NULL,
  'Home renovation',
  'a1b2c3d4-0002-0002-0002-000000000002'
),
(
  'b0000004-0004-0004-0004-000000000004',
  'LON-20260525-0004',
  'c0000003-0003-0003-0003-000000000003',
  50000.00, 3.0, 'monthly', 6,
  '2026-02-01', '2026-07-31',
  9000.00, 59000.00, 9833.33,
  0.00, 59000.00,
  'overdue', '2026-04-01',
  'Farming seeds and fertilizer',
  'a1b2c3d4-0002-0002-0002-000000000002'
);

-- ============================================================
-- LOAN PAYMENTS
-- ============================================================

INSERT INTO loan_payments (id, payment_code, loan_id, customer_id, payment_date, amount, principal_paid, interest_paid, payment_type, payment_method, created_by)
VALUES
(
  'd0000001-0001-0001-0001-000000000001',
  'PAY-20260525-0001',
  'b0000001-0001-0001-0001-000000000001',
  'c0000001-0001-0001-0001-000000000001',
  '2026-02-01', 16250.00, 12500.00, 3750.00, 'regular', 'cash',
  'a1b2c3d4-0003-0003-0003-000000000003'
),
(
  'd0000002-0002-0002-0002-000000000002',
  'PAY-20260525-0002',
  'b0000001-0001-0001-0001-000000000001',
  'c0000001-0001-0001-0001-000000000001',
  '2026-03-01', 16250.00, 12500.00, 3750.00, 'regular', 'cash',
  'a1b2c3d4-0003-0003-0003-000000000003'
),
(
  'd0000003-0003-0003-0003-000000000003',
  'PAY-20260525-0003',
  'b0000001-0001-0001-0001-000000000001',
  'c0000001-0001-0001-0001-000000000001',
  '2026-04-01', 16250.00, 12500.00, 3750.00, 'regular', 'cash',
  'a1b2c3d4-0002-0002-0002-000000000002'
),
(
  'd0000004-0004-0004-0004-000000000004',
  'PAY-20260525-0004',
  'b0000002-0002-0002-0002-000000000002',
  'c0000002-0002-0002-0002-000000000002',
  '2026-01-01', 18888.89, 13888.89, 5000.00, 'regular', 'bank_transfer',
  'a1b2c3d4-0002-0002-0002-000000000002'
),
(
  'd0000005-0005-0005-0005-000000000005',
  'PAY-20260525-0005',
  'b0000002-0002-0002-0002-000000000002',
  'c0000002-0002-0002-0002-000000000002',
  '2026-02-01', 18888.89, 13888.89, 5000.00, 'regular', 'bank_transfer',
  'a1b2c3d4-0002-0002-0002-000000000002'
),
(
  'd0000006-0006-0006-0006-000000000006',
  'PAY-20260525-0006',
  'b0000002-0002-0002-0002-000000000002',
  'c0000002-0002-0002-0002-000000000002',
  '2026-03-01', 18888.89, 13888.89, 5000.00, 'regular', 'bank_transfer',
  'a1b2c3d4-0002-0002-0002-000000000002'
);

-- ============================================================
-- SAVINGS ACCOUNTS
-- ============================================================

INSERT INTO savings_accounts (id, account_code, customer_id, account_type, interest_rate, balance, total_deposited, created_by)
VALUES
(
  'e0000001-0001-0001-0001-000000000001',
  'SAV-20260525-0001',
  'c0000005-0005-0005-0005-000000000005',
  'regular', 6.0, 125000.00, 120000.00,
  'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'e0000002-0002-0002-0002-000000000002',
  'SAV-20260525-0002',
  'c0000004-0004-0004-0004-000000000004',
  'fixed', 8.5, 300000.00, 300000.00,
  'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'e0000003-0003-0003-0003-000000000003',
  'SAV-20260525-0003',
  'c0000001-0001-0001-0001-000000000001',
  'regular', 5.0, 45000.00, 50000.00,
  'a1b2c3d4-0002-0002-0002-000000000002'
);

-- ============================================================
-- SAVINGS TRANSACTIONS
-- ============================================================

INSERT INTO savings_transactions (transaction_code, account_id, customer_id, transaction_type, amount, balance_after, transaction_date, description, created_by)
VALUES
(
  'STX-20260525-0001',
  'e0000001-0001-0001-0001-000000000001',
  'c0000005-0005-0005-0005-000000000005',
  'deposit', 50000.00, 50000.00, '2026-01-15', 'Initial deposit', 'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'STX-20260525-0002',
  'e0000001-0001-0001-0001-000000000001',
  'c0000005-0005-0005-0005-000000000005',
  'deposit', 30000.00, 80000.00, '2026-02-15', 'Monthly savings', 'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'STX-20260525-0003',
  'e0000001-0001-0001-0001-000000000001',
  'c0000005-0005-0005-0005-000000000005',
  'deposit', 25000.00, 105000.00, '2026-03-15', 'Monthly savings', 'a1b2c3d4-0003-0003-0003-000000000003'
),
(
  'STX-20260525-0004',
  'e0000001-0001-0001-0001-000000000001',
  'c0000005-0005-0005-0005-000000000005',
  'interest', 625.00, 105625.00, '2026-03-31', 'Monthly interest credit', 'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'STX-20260525-0005',
  'e0000001-0001-0001-0001-000000000001',
  'c0000005-0005-0005-0005-000000000005',
  'withdrawal', 5000.00, 100625.00, '2026-04-10', 'Emergency withdrawal', 'a1b2c3d4-0003-0003-0003-000000000003'
),
(
  'STX-20260525-0006',
  'e0000002-0002-0002-0002-000000000002',
  'c0000004-0004-0004-0004-000000000004',
  'deposit', 300000.00, 300000.00, '2026-01-01', 'Fixed deposit - 12 months', 'a1b2c3d4-0001-0001-0001-000000000001'
),
(
  'STX-20260525-0007',
  'e0000003-0003-0003-0003-000000000003',
  'c0000001-0001-0001-0001-000000000001',
  'deposit', 50000.00, 50000.00, '2026-01-05', 'Initial deposit', 'a1b2c3d4-0002-0002-0002-000000000002'
),
(
  'STX-20260525-0008',
  'e0000003-0003-0003-0003-000000000003',
  'c0000001-0001-0001-0001-000000000001',
  'withdrawal', 5000.00, 45000.00, '2026-04-20', 'Partial withdrawal', 'a1b2c3d4-0002-0002-0002-000000000002'
);

-- ============================================================
-- ACTIVITY LOGS (sample)
-- ============================================================

INSERT INTO activity_logs (user_id, user_name, user_role, action, entity_type, entity_id, entity_code, description)
VALUES
(
  'a1b2c3d4-0001-0001-0001-000000000001', 'Gopiraj Vijayakumar', 'owner',
  'LOGIN', 'session', NULL, NULL, 'User logged in'
),
(
  'a1b2c3d4-0001-0001-0001-000000000001', 'Gopiraj Vijayakumar', 'owner',
  'CREATE', 'customer', 'c0000001-0001-0001-0001-000000000001', 'CUS-20260525-0001',
  'Created customer: Suresh Tharmalingam'
),
(
  'a1b2c3d4-0001-0001-0001-000000000001', 'Gopiraj Vijayakumar', 'owner',
  'CREATE', 'loan', 'b0000001-0001-0001-0001-000000000001', 'LON-20260525-0001',
  'Created loan of ₨150,000 for Suresh Tharmalingam'
),
(
  'a1b2c3d4-0002-0002-0002-000000000002', 'Karthikeyan Murugan', 'admin',
  'CREATE', 'payment', 'd0000001-0001-0001-0001-000000000001', 'PAY-20260525-0001',
  'Recorded payment of ₨16,250 for loan LON-20260525-0001'
),
(
  'a1b2c3d4-0003-0003-0003-000000000003', 'Priya Selvam', 'staff',
  'LOGIN', 'session', NULL, NULL, 'User logged in'
);

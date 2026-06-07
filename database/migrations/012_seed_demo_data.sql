-- 012_seed_demo_data.sql
-- Demo data for Finance Management System
-- Use AFTER all migrations including 011_complete_branch_role_system.sql

-- ============================================================
-- 1. CLEAR EXISTING DATA (in correct order to respect FKs)
-- ============================================================
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

-- ============================================================
-- 2. CREATE BRANCHES
-- ============================================================
INSERT INTO branches (id, branch_code, branch_name, address, phone, email, status) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'AMPARA', 'Ampara Branch', 'Main Street, Ampara', '+94654223456', 'ampara@gvcagro.lk', 'active'),
  ('b2222222-2222-2222-2222-222222222222', 'KALMUNAI', 'Kalmunai Branch', 'Bazaar Road, Kalmunai', '+94654323456', 'kalmunai@gvcagro.lk', 'active'),
  ('b3333333-3333-3333-3333-333333333333', 'BATTICALOA', 'Batticaloa Branch', 'Main Road, Batticaloa', '+94654423456', 'batticaloa@gvcagro.lk', 'active'),
  ('b4444444-4444-4444-4444-444444444444', 'AKKARAIPATTU', 'Akkaraipattu Branch', 'Central Road, Akkaraipattu', '+94654523456', 'akkaraipattu@gvcagro.lk', 'active');

-- ============================================================
-- 3. CREATE OWNER USER
-- ============================================================
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'USR-20260607-0001',
  'owner@gvcagro.lk',
  '$2a$10$qr4P649/kwgTRtdZLgbNKu1zfrx5mfVpUohLb7mrtEKuWkwdlJb8G',  -- GvcAdmin@2026
  'Owner Admin',
  'owner',
  '+94771234567',
  'Head Office, Colombo, Sri Lanka',
  TRUE
);

-- ============================================================
-- 4. CREATE BRANCH MANAGERS (ONE PER BRANCH)
-- ============================================================
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, branch_id, is_active, created_by
) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'USR-20260607-0002', 'manager.ampara@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Manager Ampara', 'branch_manager', '+94771111111', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a0000000-0000-0000-0000-000000000001'),
  ('a2222222-2222-2222-2222-222222222222', 'USR-20260607-0003', 'manager.kalmunai@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Manager Kalmunai', 'branch_manager', '+94772222222', 'Kalmunai', 'b2222222-2222-2222-2222-222222222222', TRUE, 'a0000000-0000-0000-0000-000000000001'),
  ('a3333333-3333-3333-3333-333333333333', 'USR-20260607-0004', 'manager.batticaloa@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Manager Batticaloa', 'branch_manager', '+94773333333', 'Batticaloa', 'b3333333-3333-3333-3333-333333333333', TRUE, 'a0000000-0000-0000-0000-000000000001'),
  ('a4444444-4444-4444-4444-444444444444', 'USR-20260607-0005', 'manager.akkaraipattu@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Manager Akkaraipattu', 'branch_manager', '+94774444444', 'Akkaraipattu', 'b4444444-4444-4444-4444-444444444444', TRUE, 'a0000000-0000-0000-0000-000000000001');

-- ============================================================
-- 5. CREATE ADMINS (ONE PER BRANCH)
-- ============================================================
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, branch_id, is_active, created_by
) VALUES
  ('a5555555-5555-5555-5555-555555555551', 'USR-20260607-0010', 'admin.ampara@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Admin Ampara', 'admin', '+94781111111', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a1111111-1111-1111-1111-111111111111'),
  ('a5555555-5555-5555-5555-555555555552', 'USR-20260607-0011', 'admin.kalmunai@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Admin Kalmunai', 'admin', '+94782222222', 'Kalmunai', 'b2222222-2222-2222-2222-222222222222', TRUE, 'a2222222-2222-2222-2222-222222222222');

-- ============================================================
-- 6. CREATE CASHIERS
-- ============================================================
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, branch_id, is_active, created_by
) VALUES
  ('a6666666-6666-6666-6666-666666666661', 'USR-20260607-0020', 'cashier.ampara@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Cashier Ampara', 'cashier', '+94791111111', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a1111111-1111-1111-1111-111111111111');

-- ============================================================
-- 7. CREATE STAFF (COLLECTION OFFICERS)
-- ============================================================
INSERT INTO users (
  id, user_code, email, password_hash, full_name, role, mobile, address, branch_id, is_active, created_by
) VALUES
  ('a7777777-7777-7777-7777-777777777771', 'USR-20260607-0030', 'staff.ampara1@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Officer Ampara 1', 'staff', '+94771111117', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a1111111-1111-1111-1111-111111111111'),
  ('a7777777-7777-7777-7777-777777777772', 'USR-20260607-0031', 'staff.ampara2@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Officer Ampara 2', 'staff', '+94771111118', 'Ampara', 'b1111111-1111-1111-1111-111111111111', TRUE, 'a1111111-1111-1111-1111-111111111111'),
  ('a7777777-7777-7777-7777-777777777773', 'USR-20260607-0032', 'staff.kalmunai1@gvcagro.lk', '$2a$10$12/wJGR9scIhnb5GG.JjPutN3goRN2zOAXHDJjMoZhpyswjcG12n2', 'Officer Kalmunai 1', 'staff', '+94772222227', 'Kalmunai', 'b2222222-2222-2222-2222-222222222222', TRUE, 'a2222222-2222-2222-2222-222222222222');

-- ============================================================
-- 8. CREATE DEMO CUSTOMERS (in branches)
-- ============================================================
INSERT INTO customers (
  id, customer_code, full_name, nic_number, phone, email, address, date_of_birth, gender, occupation, monthly_income, branch_id, is_active, created_by
) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'CUS-20260607-0001', 'Raj Kumar', '200123456789', '+94771111120', 'raj@example.com', 'Ampara Street 1', '1980-01-15', 'male', 'Business Owner', 50000, 'b1111111-1111-1111-1111-111111111111', TRUE, 'a5555555-5555-5555-5555-555555555551'),
  ('c2222222-2222-2222-2222-222222222222', 'CUS-20260607-0002', 'Lakshmi Priya', '200234567890', '+94771111121', 'lakshmi@example.com', 'Ampara Street 2', '1985-03-20', 'female', 'Shop Owner', 45000, 'b1111111-1111-1111-1111-111111111111', TRUE, 'a5555555-5555-5555-5555-555555555551');

-- All passwords default to: Password@2026
-- Branch: Ampara, Manager: manager.ampara@gvcagro.lk / Admin: admin.ampara@gvcagro.lk / Cashier: cashier.ampara@gvcagro.lk
-- Staff Officers: staff.ampara1@gvcagro.lk, staff.ampara2@gvcagro.lk

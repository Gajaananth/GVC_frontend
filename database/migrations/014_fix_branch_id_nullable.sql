-- 014_fix_branch_id_nullable.sql
-- Make branch_id nullable on fixed_deposits and savings_accounts tables
-- This allows the owner to create FDs and savings accounts for customers without a branch

-- Fix fixed_deposits table: ensure branch_id is nullable
ALTER TABLE fixed_deposits ALTER COLUMN branch_id DROP NOT NULL;

-- Fix savings_accounts table: ensure branch_id is nullable
ALTER TABLE savings_accounts ALTER COLUMN branch_id DROP NOT NULL;

-- 008_loan_application_url.sql
-- Add loan_application_url to loans table for user-uploaded physical application PDFs

ALTER TABLE loans
ADD COLUMN IF NOT EXISTS loan_application_url TEXT;

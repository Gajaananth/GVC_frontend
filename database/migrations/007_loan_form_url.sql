-- Add loan_form_url column to store the auto-generated loan application PDF in Supabase Storage
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_form_url TEXT;

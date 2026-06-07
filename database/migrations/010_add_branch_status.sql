-- Migration: add branch status column
ALTER TABLE branches
  ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Ensure existing branches have a valid status value
UPDATE branches SET status = 'active' WHERE status IS NULL;

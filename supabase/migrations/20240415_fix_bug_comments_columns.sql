-- Fix bug comments table schema
ALTER TABLE bug_comments_mgg2024 
  -- First rename existing columns if they exist
  DROP COLUMN IF EXISTS user_full_name,
  DROP COLUMN IF EXISTS user_name,
  -- Add correct columns
  ADD COLUMN user_name TEXT NOT NULL,
  ADD COLUMN user_full_name TEXT;
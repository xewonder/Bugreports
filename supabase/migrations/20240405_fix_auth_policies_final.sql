-- COMPLETE FIX for RLS policies
-- First, disable RLS to make changes
ALTER TABLE IF EXISTS profiles_mgg_2024 DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "Admins have full access" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "enable_read_own_profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "enable_update_own_profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "enable_insert_own_profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "enable_admin_full_access" ON profiles_mgg_2024;

-- Ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS profiles_mgg_2024 (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  nickname TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'technician', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-enable RLS
ALTER TABLE profiles_mgg_2024 ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies with no recursion
CREATE POLICY "profiles_select_policy" 
  ON profiles_mgg_2024 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_policy" 
  ON profiles_mgg_2024 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" 
  ON profiles_mgg_2024 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON profiles_mgg_2024 TO authenticated;
GRANT SELECT ON profiles_mgg_2024 TO anon;

-- Make sure we have public access for anon users
ALTER PUBLICATION IF EXISTS supabase_realtime ADD TABLE profiles_mgg_2024;
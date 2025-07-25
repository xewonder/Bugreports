-- Fix infinite recursion in RLS policies for profiles_mgg_2024

-- First, disable RLS temporarily to fix the policies
ALTER TABLE profiles_mgg_2024 DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "Admins have full access" ON profiles_mgg_2024;

-- Re-enable RLS
ALTER TABLE profiles_mgg_2024 ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "enable_read_own_profile" ON profiles_mgg_2024
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "enable_update_own_profile" ON profiles_mgg_2024
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "enable_insert_own_profile" ON profiles_mgg_2024
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policy that checks email directly from auth.users without recursion
CREATE POLICY "enable_admin_full_access" ON profiles_mgg_2024
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@mgg.com'
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles_mgg_2024 TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles_mgg_2024 TO anon;
-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles_mgg_2024;
DROP POLICY IF EXISTS "Admins have full access" ON profiles_mgg_2024;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read their own profile" ON profiles_mgg_2024 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles_mgg_2024 
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles_mgg_2024 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policy using direct role check without recursion
CREATE POLICY "Admins have full access" ON profiles_mgg_2024 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@mgg.com'
  )
);

-- Ensure the table has RLS enabled
ALTER TABLE profiles_mgg_2024 ENABLE ROW LEVEL SECURITY;
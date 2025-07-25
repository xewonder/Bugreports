-- Update the role enum in the profiles table
ALTER TABLE profiles_mgg_2024
  DROP CONSTRAINT IF EXISTS profiles_mgg_2024_role_check;

ALTER TABLE profiles_mgg_2024
  ADD CONSTRAINT profiles_mgg_2024_role_check 
  CHECK (role IN ('user', 'developer', 'admin'));

-- Update existing technician roles to developer
UPDATE profiles_mgg_2024
SET role = 'developer'
WHERE role = 'technician';
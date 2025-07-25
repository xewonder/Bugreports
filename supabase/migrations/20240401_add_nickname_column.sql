-- Add nickname column to profiles if it doesn't exist
ALTER TABLE profiles_mgg_2024 ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Update existing profiles with default nicknames from email
UPDATE profiles_mgg_2024 
SET nickname = COALESCE(full_name, SPLIT_PART(email, '@', 1)) 
WHERE nickname IS NULL;

-- Create index on nickname for faster searches
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles_mgg_2024(nickname);
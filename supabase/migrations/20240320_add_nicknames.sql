-- Add nickname column to profiles
ALTER TABLE profiles_mgg_2024
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Update existing profiles with default nicknames from email
UPDATE profiles_mgg_2024
SET nickname = COALESCE(
  full_name,
  SPLIT_PART(email, '@', 1)
)
WHERE nickname IS NULL;

-- Make nickname required for future entries
ALTER TABLE profiles_mgg_2024
ALTER COLUMN nickname SET NOT NULL;

-- Add trigger to set default nickname from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles_mgg_2024 (
    id,
    email,
    full_name,
    nickname,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    CASE
      WHEN NEW.email = 'admin@mgg.com' THEN 'admin'
      WHEN NEW.email = 'tech@mgg.com' THEN 'technician'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
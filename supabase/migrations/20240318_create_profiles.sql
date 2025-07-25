-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles_mgg_2024 (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'technician', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles_mgg_2024 ENABLE ROW LEVEL SECURITY;

-- Create profiles trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles_mgg_2024 (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE 
      WHEN NEW.email = 'admin@mgg.com' THEN 'admin'
      WHEN NEW.email = 'tech@mgg.com' THEN 'technician'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policies
CREATE POLICY "Users can read their own profile"
  ON profiles_mgg_2024
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles_mgg_2024
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access"
  ON profiles_mgg_2024
  USING (
    EXISTS (
      SELECT 1 FROM profiles_mgg_2024
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert initial admin user if not exists
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
SELECT 
  gen_random_uuid(),
  'admin@mgg.com',
  crypt('admin123', gen_salt('bf')),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@mgg.com'
);
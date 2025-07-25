-- Complete database setup for MGG™ Software Package
-- This migration combines all necessary table creations and configurations

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles_mgg_2024 (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  nickname TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles_mgg_2024 ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "profiles_select_policy" ON profiles_mgg_2024 FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_policy" ON profiles_mgg_2024 FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON profiles_mgg_2024 FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON profiles_mgg_2024 TO authenticated;
GRANT SELECT ON profiles_mgg_2024 TO anon;

-- Create profiles trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles_mgg_2024 (
    id,
    email,
    full_name,
    nickname,
    role
  ) VALUES (
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
      WHEN NEW.email = 'tech@mgg.com' THEN 'developer'
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

-- ============================================================================
-- BUGS TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS bugs_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  severity TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  assignee TEXT,
  reporter_name TEXT NOT NULL,
  reporter_id UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bug_comments_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID NOT NULL REFERENCES bugs_mgg2024(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_full_name TEXT,
  user_nickname TEXT,
  user_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bug_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID NOT NULL REFERENCES bugs_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bug_id, user_id)
);

-- Enable RLS for bugs tables
ALTER TABLE bugs_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_comments_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Bug policies
CREATE POLICY "Anyone can read bugs" ON bugs_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create bugs" ON bugs_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own bugs" ON bugs_mgg2024 FOR UPDATE USING (reporter_id = auth.uid());
CREATE POLICY "Developers and admins can update any bug" ON bugs_mgg2024 FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);
CREATE POLICY "Developers and admins can delete any bug" ON bugs_mgg2024 FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);

-- Bug comments policies
CREATE POLICY "Anyone can read bug comments" ON bug_comments_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create bug comments" ON bug_comments_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own bug comments" ON bug_comments_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own bug comments" ON bug_comments_mgg2024 FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Developers and admins can delete any bug comment" ON bug_comments_mgg2024 FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);

-- Bug votes policies
CREATE POLICY "Anyone can read bug votes" ON bug_votes_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote on bugs" ON bug_votes_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own bug votes" ON bug_votes_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own bug votes" ON bug_votes_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- FEATURE REQUESTS TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_requests_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'under_review', 'planned', 'in_progress', 'completed', 'declined')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_nickname TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_request_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_request_id, user_id)
);

-- Enable RLS for feature request tables
ALTER TABLE feature_requests_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Feature request policies
CREATE POLICY "Anyone can read feature requests" ON feature_requests_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create feature requests" ON feature_requests_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own feature requests" ON feature_requests_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Developers and admins can update any feature request" ON feature_requests_mgg2024 FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);
CREATE POLICY "Developers and admins can delete any feature request" ON feature_requests_mgg2024 FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);

-- Feature request votes policies
CREATE POLICY "Anyone can read feature request votes" ON feature_request_votes_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote on feature requests" ON feature_request_votes_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own feature request votes" ON feature_request_votes_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- POWER PROMPTS TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS power_prompts_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS power_prompt_comments_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES power_prompts_mgg2024(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_nickname TEXT,
  user_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS power_prompt_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES power_prompts_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- Enable RLS for power prompts tables
ALTER TABLE power_prompts_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_prompt_comments_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_prompt_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Power prompts policies
CREATE POLICY "Anyone can read power prompts" ON power_prompts_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create power prompts" ON power_prompts_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own power prompts" ON power_prompts_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own power prompts" ON power_prompts_mgg2024 FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Developers and admins can delete any power prompt" ON power_prompts_mgg2024 FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);

-- Power prompt comments policies
CREATE POLICY "Anyone can read power prompt comments" ON power_prompt_comments_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create power prompt comments" ON power_prompt_comments_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own power prompt comments" ON power_prompt_comments_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own power prompt comments" ON power_prompt_comments_mgg2024 FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Developers and admins can delete any power prompt comment" ON power_prompt_comments_mgg2024 FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);

-- Power prompt votes policies
CREATE POLICY "Anyone can read power prompt votes" ON power_prompt_votes_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote on power prompts" ON power_prompt_votes_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own power prompt votes" ON power_prompt_votes_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own power prompt votes" ON power_prompt_votes_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- ROADMAP TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS roadmap_items_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planning', 'in-progress', 'completed', 'delayed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  estimated_completion DATE,
  actual_completion DATE,
  assignee TEXT,
  tags TEXT[] DEFAULT '{}',
  quarter TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_comments_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items_mgg2024(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(roadmap_item_id, user_id)
);

-- Enable RLS for roadmap tables
ALTER TABLE roadmap_items_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_comments_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Roadmap items policies
CREATE POLICY "Anyone can read roadmap items" ON roadmap_items_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Developers and admins can create roadmap items" ON roadmap_items_mgg2024 FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);
CREATE POLICY "Developers and admins can update roadmap items" ON roadmap_items_mgg2024 FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);

-- Roadmap comments policies
CREATE POLICY "Anyone can read roadmap comments" ON roadmap_comments_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create roadmap comments" ON roadmap_comments_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own roadmap comments" ON roadmap_comments_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own roadmap comments" ON roadmap_comments_mgg2024 FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Developers and admins can delete any roadmap comment" ON roadmap_comments_mgg2024 FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
  )
);

-- Roadmap votes policies
CREATE POLICY "Anyone can read roadmap votes" ON roadmap_votes_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote on roadmap items" ON roadmap_votes_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own roadmap votes" ON roadmap_votes_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own roadmap votes" ON roadmap_votes_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles_mgg_2024(nickname);
CREATE INDEX IF NOT EXISTS idx_bugs_reporter_id ON bugs_mgg2024(reporter_id);
CREATE INDEX IF NOT EXISTS idx_bug_comments_bug_id ON bug_comments_mgg2024(bug_id);
CREATE INDEX IF NOT EXISTS idx_bug_votes_bug_id ON bug_votes_mgg2024(bug_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_user_id ON feature_requests_mgg2024(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests_mgg2024(status);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_request_id ON feature_request_votes_mgg2024(feature_request_id);
CREATE INDEX IF NOT EXISTS idx_power_prompts_user_id ON power_prompts_mgg2024(user_id);
CREATE INDEX IF NOT EXISTS idx_power_prompt_comments_prompt_id ON power_prompt_comments_mgg2024(prompt_id);
CREATE INDEX IF NOT EXISTS idx_power_prompt_votes_prompt_id ON power_prompt_votes_mgg2024(prompt_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_comments_item_id ON roadmap_comments_mgg2024(roadmap_item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_item_id ON roadmap_votes_mgg2024(roadmap_item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_assignee ON roadmap_items_mgg2024(assignee);
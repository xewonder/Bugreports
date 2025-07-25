-- Create power_prompts table
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

-- Create power_prompt_comments table
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

-- Create power_prompt_votes table
CREATE TABLE IF NOT EXISTS power_prompt_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES power_prompts_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- Enable RLS
ALTER TABLE power_prompts_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_prompt_comments_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_prompt_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create policies for power_prompts
CREATE POLICY "Anyone can read power prompts" ON power_prompts_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create power prompts" ON power_prompts_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own power prompts" ON power_prompts_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own power prompts" ON power_prompts_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- Create policies for power_prompt_comments
CREATE POLICY "Anyone can read power prompt comments" ON power_prompt_comments_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create power prompt comments" ON power_prompt_comments_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own power prompt comments" ON power_prompt_comments_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own power prompt comments" ON power_prompt_comments_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- Create policies for power_prompt_votes
CREATE POLICY "Anyone can read power prompt votes" ON power_prompt_votes_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote on power prompts" ON power_prompt_votes_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own power prompt votes" ON power_prompt_votes_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own power prompt votes" ON power_prompt_votes_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_power_prompts_user_id ON power_prompts_mgg2024(user_id);
CREATE INDEX IF NOT EXISTS idx_power_prompt_comments_prompt_id ON power_prompt_comments_mgg2024(prompt_id);
CREATE INDEX IF NOT EXISTS idx_power_prompt_votes_prompt_id ON power_prompt_votes_mgg2024(prompt_id);
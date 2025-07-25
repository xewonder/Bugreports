-- Create roadmap comments table
CREATE TABLE IF NOT EXISTS roadmap_comments_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL,
  text TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create roadmap votes table
CREATE TABLE IF NOT EXISTS roadmap_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(roadmap_item_id, user_id)
);

-- Create bug votes table
CREATE TABLE IF NOT EXISTS bug_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bug_id, user_id)
);

-- Enable RLS
ALTER TABLE roadmap_comments_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_votes_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Policies for roadmap comments
CREATE POLICY "Anyone can read roadmap comments" ON roadmap_comments_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create roadmap comments" ON roadmap_comments_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own roadmap comments" ON roadmap_comments_mgg2024
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own roadmap comments" ON roadmap_comments_mgg2024
  FOR DELETE USING (user_id = auth.uid());

-- Policies for roadmap votes
CREATE POLICY "Anyone can read roadmap votes" ON roadmap_votes_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on roadmap items" ON roadmap_votes_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own roadmap votes" ON roadmap_votes_mgg2024
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own roadmap votes" ON roadmap_votes_mgg2024
  FOR DELETE USING (user_id = auth.uid());

-- Policies for bug votes
CREATE POLICY "Anyone can read bug votes" ON bug_votes_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on bugs" ON bug_votes_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own bug votes" ON bug_votes_mgg2024
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own bug votes" ON bug_votes_mgg2024
  FOR DELETE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roadmap_comments_item_id ON roadmap_comments_mgg2024(roadmap_item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_item_id ON roadmap_votes_mgg2024(roadmap_item_id);
CREATE INDEX IF NOT EXISTS idx_bug_votes_bug_id ON bug_votes_mgg2024(bug_id);
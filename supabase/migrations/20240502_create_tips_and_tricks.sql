-- Create tips and tricks table
CREATE TABLE IF NOT EXISTS tips_and_tricks_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tips comments table
CREATE TABLE IF NOT EXISTS tips_comments_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES tips_and_tricks_mgg2024(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  user_id UUID NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tips votes table
CREATE TABLE IF NOT EXISTS tips_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES tips_and_tricks_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tip_id, user_id)
);

-- Enable RLS
ALTER TABLE tips_and_tricks_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips_comments_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create policies for tips_and_tricks
CREATE POLICY "Anyone can read tips and tricks" ON tips_and_tricks_mgg2024 
  FOR SELECT USING (true);
  
CREATE POLICY "Authenticated users can create tips" ON tips_and_tricks_mgg2024 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  
CREATE POLICY "Users can update their own tips" ON tips_and_tricks_mgg2024 
  FOR UPDATE USING (user_id = auth.uid());
  
CREATE POLICY "Users can delete their own tips" ON tips_and_tricks_mgg2024 
  FOR DELETE USING (user_id = auth.uid());
  
CREATE POLICY "Admins and developers can delete any tip" ON tips_and_tricks_mgg2024 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_mgg_2024 
      WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
    )
  );

-- Create policies for tips_comments
CREATE POLICY "Anyone can read tips comments" ON tips_comments_mgg2024 
  FOR SELECT USING (true);
  
CREATE POLICY "Authenticated users can create tips comments" ON tips_comments_mgg2024 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  
CREATE POLICY "Users can update their own tips comments" ON tips_comments_mgg2024 
  FOR UPDATE USING (user_id = auth.uid());
  
CREATE POLICY "Users can delete their own tips comments" ON tips_comments_mgg2024 
  FOR DELETE USING (user_id = auth.uid());
  
CREATE POLICY "Admins and developers can delete any tips comment" ON tips_comments_mgg2024 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_mgg_2024 
      WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
    )
  );

-- Create policies for tips_votes
CREATE POLICY "Anyone can read tips votes" ON tips_votes_mgg2024 
  FOR SELECT USING (true);
  
CREATE POLICY "Authenticated users can vote on tips" ON tips_votes_mgg2024 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  
CREATE POLICY "Users can delete their own tips votes" ON tips_votes_mgg2024 
  FOR DELETE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tips_and_tricks_user_id ON tips_and_tricks_mgg2024(user_id);
CREATE INDEX IF NOT EXISTS idx_tips_comments_tip_id ON tips_comments_mgg2024(tip_id);
CREATE INDEX IF NOT EXISTS idx_tips_votes_tip_id ON tips_votes_mgg2024(tip_id);
CREATE INDEX IF NOT EXISTS idx_tips_and_tricks_attachments ON tips_and_tricks_mgg2024 USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_tips_comments_attachments ON tips_comments_mgg2024 USING GIN (attachments);

-- Create views for easier querying with user data
CREATE OR REPLACE VIEW tips_and_tricks_with_users AS
SELECT 
  t.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM tips_and_tricks_mgg2024 t
LEFT JOIN profiles_mgg_2024 p ON t.user_id = p.id;

CREATE OR REPLACE VIEW tips_comments_with_users AS
SELECT 
  tc.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM tips_comments_mgg2024 tc
LEFT JOIN profiles_mgg_2024 p ON tc.user_id = p.id;

-- Grant permissions on views
GRANT SELECT ON tips_and_tricks_with_users TO authenticated, anon;
GRANT SELECT ON tips_comments_with_users TO authenticated, anon;
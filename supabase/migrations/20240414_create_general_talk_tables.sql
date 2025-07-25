-- Create general_topics table
CREATE TABLE IF NOT EXISTS general_topics_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_nickname TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create general_topic_comments table
CREATE TABLE IF NOT EXISTS general_topic_comments_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES general_topics_mgg2024(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_nickname TEXT,
  user_role TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create general_topic_votes table
CREATE TABLE IF NOT EXISTS general_topic_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES general_topics_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topic_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE general_topics_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_topic_comments_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_topic_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create policies for general_topics
CREATE POLICY "Anyone can read general topics" ON general_topics_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create general topics" ON general_topics_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own general topics" ON general_topics_mgg2024
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own general topics" ON general_topics_mgg2024
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins and developers can delete any general topic" ON general_topics_mgg2024
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_mgg_2024
      WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
    )
  );

-- Create policies for general_topic_comments
CREATE POLICY "Anyone can read general topic comments" ON general_topic_comments_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create general topic comments" ON general_topic_comments_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own general topic comments" ON general_topic_comments_mgg2024
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own general topic comments" ON general_topic_comments_mgg2024
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins and developers can delete any general topic comment" ON general_topic_comments_mgg2024
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_mgg_2024
      WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
    )
  );

-- Create policies for general_topic_votes
CREATE POLICY "Anyone can read general topic votes" ON general_topic_votes_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on general topics" ON general_topic_votes_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own general topic votes" ON general_topic_votes_mgg2024
  FOR DELETE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_general_topics_user_id ON general_topics_mgg2024(user_id);
CREATE INDEX IF NOT EXISTS idx_general_topic_comments_topic_id ON general_topic_comments_mgg2024(topic_id);
CREATE INDEX IF NOT EXISTS idx_general_topic_votes_topic_id ON general_topic_votes_mgg2024(topic_id);
CREATE INDEX IF NOT EXISTS idx_general_topic_attachments ON general_topics_mgg2024 USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_general_topic_comments_attachments ON general_topic_comments_mgg2024 USING GIN (attachments);
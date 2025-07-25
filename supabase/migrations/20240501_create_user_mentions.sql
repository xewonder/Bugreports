-- Create user_mentions table for storing mentions
CREATE TABLE IF NOT EXISTS user_mentions_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentioned_user_id UUID NOT NULL,
  mentioned_by_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the mentions table
ALTER TABLE user_mentions_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create policies for the mentions table
CREATE POLICY "Anyone can read mentions" ON user_mentions_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create mentions" ON user_mentions_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own mentions" ON user_mentions_mgg2024
  FOR UPDATE USING (mentioned_user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_mentions_mentioned_user_id ON user_mentions_mgg2024(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_user_mentions_mentioned_by_id ON user_mentions_mgg2024(mentioned_by_id);
CREATE INDEX IF NOT EXISTS idx_user_mentions_content_id ON user_mentions_mgg2024(content_id);
CREATE INDEX IF NOT EXISTS idx_user_mentions_seen ON user_mentions_mgg2024(seen);
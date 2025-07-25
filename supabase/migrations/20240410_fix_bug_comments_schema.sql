-- First drop the existing bug comments table if it exists
DROP TABLE IF EXISTS bug_comments_mgg2024;

-- Recreate the bug comments table with correct column names
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

-- Enable RLS
ALTER TABLE bug_comments_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Anyone can read comments" ON bug_comments_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON bug_comments_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own comments" ON bug_comments_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own comments" ON bug_comments_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bug_comments_bug_id ON bug_comments_mgg2024(bug_id);
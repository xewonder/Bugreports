-- Create bugs table
CREATE TABLE IF NOT EXISTS bugs_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee TEXT,
  reporter_name TEXT NOT NULL,
  reporter_id UUID NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bug comments table
CREATE TABLE IF NOT EXISTS bug_comments_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID NOT NULL REFERENCES bugs_mgg2024(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_nickname TEXT,
  user_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bug votes table
CREATE TABLE IF NOT EXISTS bug_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID NOT NULL REFERENCES bugs_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bug_id, user_id)
);

-- Enable RLS
ALTER TABLE bugs_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_comments_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create policies for bugs
CREATE POLICY "Anyone can read bugs" ON bugs_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create bugs" ON bugs_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own bugs" ON bugs_mgg2024
  FOR UPDATE USING (reporter_id = auth.uid());

CREATE POLICY "Technicians can update any bug" ON bugs_mgg2024
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles_mgg_2024
      WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin')
    )
  );

-- Create policies for comments
CREATE POLICY "Anyone can read comments" ON bug_comments_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON bug_comments_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON bug_comments_mgg2024
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON bug_comments_mgg2024
  FOR DELETE USING (user_id = auth.uid());

-- Create policies for votes
CREATE POLICY "Anyone can read votes" ON bug_votes_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON bug_votes_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own votes" ON bug_votes_mgg2024
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes" ON bug_votes_mgg2024
  FOR DELETE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bugs_reporter_id ON bugs_mgg2024(reporter_id);
CREATE INDEX IF NOT EXISTS idx_bug_comments_bug_id ON bug_comments_mgg2024(bug_id);
CREATE INDEX IF NOT EXISTS idx_bug_votes_bug_id ON bug_votes_mgg2024(bug_id);
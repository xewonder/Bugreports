-- Create feature requests table
CREATE TABLE IF NOT EXISTS feature_requests_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'under_review', 'planned', 'in_progress', 'completed', 'declined')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on feature requests table
ALTER TABLE feature_requests_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create feature request votes table
CREATE TABLE IF NOT EXISTS feature_request_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_request_id, user_id)
);

-- Enable RLS on feature request votes table
ALTER TABLE feature_request_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create feature request comments table
CREATE TABLE IF NOT EXISTS feature_request_comments_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests_mgg2024(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on feature request comments table
ALTER TABLE feature_request_comments_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create policies for feature requests
CREATE POLICY "Anyone can read feature requests" ON feature_requests_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create feature requests" ON feature_requests_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own feature requests" ON feature_requests_mgg2024
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Technicians and admins can update any feature request" ON feature_requests_mgg2024
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_mgg_2024
      WHERE id = auth.uid() AND (role = 'technician' OR role = 'admin')
    )
  );

-- Create policies for feature request votes
CREATE POLICY "Anyone can read feature request votes" ON feature_request_votes_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on feature requests" ON feature_request_votes_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own votes" ON feature_request_votes_mgg2024
  FOR DELETE USING (user_id = auth.uid());

-- Create policies for feature request comments
CREATE POLICY "Anyone can read feature request comments" ON feature_request_comments_mgg2024
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON feature_request_comments_mgg2024
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON feature_request_comments_mgg2024
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON feature_request_comments_mgg2024
  FOR DELETE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_requests_user_id ON feature_requests_mgg2024(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests_mgg2024(status);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_request_id ON feature_request_votes_mgg2024(feature_request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_request_id ON feature_request_comments_mgg2024(feature_request_id);
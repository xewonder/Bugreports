-- Create roadmap items table
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

-- Create roadmap comments table
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

-- Create roadmap votes table
CREATE TABLE IF NOT EXISTS roadmap_votes_mgg2024 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items_mgg2024(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(roadmap_item_id, user_id)
);

-- Enable RLS
ALTER TABLE roadmap_items_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_comments_mgg2024 ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_votes_mgg2024 ENABLE ROW LEVEL SECURITY;

-- Create policies for roadmap items
CREATE POLICY "Anyone can read roadmap items" ON roadmap_items_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Technicians and admins can update roadmap items" ON roadmap_items_mgg2024 FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles_mgg_2024 
    WHERE id = auth.uid() AND (role = 'technician' OR role = 'admin')
  )
);

-- Create policies for roadmap comments
CREATE POLICY "Anyone can read roadmap comments" ON roadmap_comments_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create roadmap comments" ON roadmap_comments_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own roadmap comments" ON roadmap_comments_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own roadmap comments" ON roadmap_comments_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- Create policies for roadmap votes
CREATE POLICY "Anyone can read roadmap votes" ON roadmap_votes_mgg2024 FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote on roadmap items" ON roadmap_votes_mgg2024 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own roadmap votes" ON roadmap_votes_mgg2024 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own roadmap votes" ON roadmap_votes_mgg2024 FOR DELETE USING (user_id = auth.uid());

-- No demo data inserted - table starts empty
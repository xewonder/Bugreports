-- Add attachments columns to all main tables

-- Add to bugs table
ALTER TABLE bugs_mgg2024 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add to bug comments table
ALTER TABLE bug_comments_mgg2024 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add to feature requests table
ALTER TABLE feature_requests_mgg2024 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add to feature request comments table
ALTER TABLE feature_request_comments_mgg2024 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add to power prompts table
ALTER TABLE power_prompts_mgg2024 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add to power prompt comments table
ALTER TABLE power_prompt_comments_mgg2024 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add to roadmap items table
ALTER TABLE roadmap_items_mgg2024 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add to roadmap comments table
ALTER TABLE roadmap_comments_mgg2024 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Create indexes for better performance on attachment queries
CREATE INDEX IF NOT EXISTS idx_bugs_attachments ON bugs_mgg2024 USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_bug_comments_attachments ON bug_comments_mgg2024 USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_feature_requests_attachments ON feature_requests_mgg2024 USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_attachments ON feature_request_comments_mgg2024 USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_power_prompts_attachments ON power_prompts_mgg2024 USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_power_prompt_comments_attachments ON power_prompt_comments_mgg2024 USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_attachments ON roadmap_items_mgg2024 USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_roadmap_comments_attachments ON roadmap_comments_mgg2024 USING GIN (attachments);
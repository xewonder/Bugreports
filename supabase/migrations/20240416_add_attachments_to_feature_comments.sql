-- Add attachments column to feature_request_comments_mgg2024 table
ALTER TABLE feature_request_comments_mgg2024 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add user_nickname column if it doesn't exist
ALTER TABLE feature_request_comments_mgg2024 ADD COLUMN IF NOT EXISTS user_nickname TEXT;

-- Create index for better performance on attachment queries
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_attachments ON feature_request_comments_mgg2024 USING GIN (attachments);

-- Update existing records to have empty attachments array
UPDATE feature_request_comments_mgg2024 SET attachments = '[]' WHERE attachments IS NULL;
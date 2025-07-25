-- Add tags column to feature requests table
ALTER TABLE feature_requests_mgg2024 ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Update existing records to have empty tags array
UPDATE feature_requests_mgg2024 SET tags = '{}' WHERE tags IS NULL;
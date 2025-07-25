-- Add missing assignee column to roadmap_items_mgg2024
ALTER TABLE roadmap_items_mgg2024 ADD COLUMN IF NOT EXISTS assignee TEXT;

-- Create index for better performance when filtering by assignee
CREATE INDEX IF NOT EXISTS idx_roadmap_items_assignee ON roadmap_items_mgg2024(assignee);
-- NORMALIZE USER DATA - Remove redundant user fields and use JOINs instead
-- This migration removes all redundant user data fields and keeps only user_id

-- ============================================================================
-- FEATURE REQUESTS TABLE
-- ============================================================================
ALTER TABLE feature_requests_mgg2024 
  DROP COLUMN IF EXISTS user_name,
  DROP COLUMN IF EXISTS user_nickname;

-- ============================================================================
-- FEATURE REQUEST COMMENTS TABLE
-- ============================================================================
ALTER TABLE feature_request_comments_mgg2024 
  DROP COLUMN IF EXISTS user_name,
  DROP COLUMN IF EXISTS user_nickname,
  DROP COLUMN IF EXISTS user_role;

-- ============================================================================
-- POWER PROMPTS TABLE
-- ============================================================================
ALTER TABLE power_prompts_mgg2024 
  DROP COLUMN IF EXISTS user_name,
  DROP COLUMN IF EXISTS user_nickname;

-- ============================================================================
-- POWER PROMPT COMMENTS TABLE
-- ============================================================================
ALTER TABLE power_prompt_comments_mgg2024 
  DROP COLUMN IF EXISTS user_name,
  DROP COLUMN IF EXISTS user_nickname,
  DROP COLUMN IF EXISTS user_role;

-- ============================================================================
-- BUGS TABLE
-- ============================================================================
ALTER TABLE bugs_mgg2024 
  DROP COLUMN IF EXISTS reporter_name;

-- ============================================================================
-- BUG COMMENTS TABLE
-- ============================================================================
ALTER TABLE bug_comments_mgg2024 
  DROP COLUMN IF EXISTS user_name,
  DROP COLUMN IF EXISTS user_full_name,
  DROP COLUMN IF EXISTS user_nickname,
  DROP COLUMN IF EXISTS user_role;

-- ============================================================================
-- ROADMAP COMMENTS TABLE
-- ============================================================================
ALTER TABLE roadmap_comments_mgg2024 
  DROP COLUMN IF EXISTS user_name,
  DROP COLUMN IF EXISTS user_role;

-- ============================================================================
-- GENERAL TOPICS TABLE
-- ============================================================================
ALTER TABLE general_topics_mgg2024 
  DROP COLUMN IF EXISTS user_name,
  DROP COLUMN IF EXISTS user_nickname;

-- ============================================================================
-- GENERAL TOPIC COMMENTS TABLE
-- ============================================================================
ALTER TABLE general_topic_comments_mgg2024 
  DROP COLUMN IF EXISTS user_name,
  DROP COLUMN IF EXISTS user_nickname,
  DROP COLUMN IF EXISTS user_role;

-- ============================================================================
-- CREATE VIEWS FOR EASY QUERYING WITH USER DATA
-- ============================================================================

-- Feature Requests with User Data
CREATE OR REPLACE VIEW feature_requests_with_users AS
SELECT 
  fr.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM feature_requests_mgg2024 fr
LEFT JOIN profiles_mgg_2024 p ON fr.user_id = p.id;

-- Feature Request Comments with User Data
CREATE OR REPLACE VIEW feature_request_comments_with_users AS
SELECT 
  frc.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM feature_request_comments_mgg2024 frc
LEFT JOIN profiles_mgg_2024 p ON frc.user_id = p.id;

-- Power Prompts with User Data
CREATE OR REPLACE VIEW power_prompts_with_users AS
SELECT 
  pp.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM power_prompts_mgg2024 pp
LEFT JOIN profiles_mgg_2024 p ON pp.user_id = p.id;

-- Power Prompt Comments with User Data
CREATE OR REPLACE VIEW power_prompt_comments_with_users AS
SELECT 
  ppc.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM power_prompt_comments_mgg2024 ppc
LEFT JOIN profiles_mgg_2024 p ON ppc.user_id = p.id;

-- Bugs with User Data
CREATE OR REPLACE VIEW bugs_with_users AS
SELECT 
  b.*,
  p.full_name as reporter_full_name,
  p.nickname as reporter_nickname,
  p.role as reporter_role
FROM bugs_mgg2024 b
LEFT JOIN profiles_mgg_2024 p ON b.reporter_id = p.id;

-- Bug Comments with User Data
CREATE OR REPLACE VIEW bug_comments_with_users AS
SELECT 
  bc.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM bug_comments_mgg2024 bc
LEFT JOIN profiles_mgg_2024 p ON bc.user_id = p.id;

-- Roadmap Comments with User Data
CREATE OR REPLACE VIEW roadmap_comments_with_users AS
SELECT 
  rc.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM roadmap_comments_mgg2024 rc
LEFT JOIN profiles_mgg_2024 p ON rc.user_id = p.id;

-- General Topics with User Data
CREATE OR REPLACE VIEW general_topics_with_users AS
SELECT 
  gt.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM general_topics_mgg2024 gt
LEFT JOIN profiles_mgg_2024 p ON gt.user_id = p.id;

-- General Topic Comments with User Data
CREATE OR REPLACE VIEW general_topic_comments_with_users AS
SELECT 
  gtc.*,
  p.full_name as user_full_name,
  p.nickname as user_nickname,
  p.role as user_role
FROM general_topic_comments_mgg2024 gtc
LEFT JOIN profiles_mgg_2024 p ON gtc.user_id = p.id;

-- ============================================================================
-- GRANT PERMISSIONS ON VIEWS
-- ============================================================================
GRANT SELECT ON feature_requests_with_users TO authenticated, anon;
GRANT SELECT ON feature_request_comments_with_users TO authenticated, anon;
GRANT SELECT ON power_prompts_with_users TO authenticated, anon;
GRANT SELECT ON power_prompt_comments_with_users TO authenticated, anon;
GRANT SELECT ON bugs_with_users TO authenticated, anon;
GRANT SELECT ON bug_comments_with_users TO authenticated, anon;
GRANT SELECT ON roadmap_comments_with_users TO authenticated, anon;
GRANT SELECT ON general_topics_with_users TO authenticated, anon;
GRANT SELECT ON general_topic_comments_with_users TO authenticated, anon;
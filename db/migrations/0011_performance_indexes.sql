-- Performance Optimization: Composite Indexes
-- These indexes speed up common query patterns

BEGIN;

-- Composite index for user + status queries (dashboard filtering)
CREATE INDEX IF NOT EXISTS idx_applications_user_status 
ON applications(user_id, status) 
WHERE status IS NOT NULL;

-- Composite index for user + company searches
CREATE INDEX IF NOT EXISTS idx_applications_user_company 
ON applications(user_id, company) 
WHERE company IS NOT NULL;

-- Composite index for user + position searches  
CREATE INDEX IF NOT EXISTS idx_applications_user_position 
ON applications(user_id, position) 
WHERE position IS NOT NULL;

-- Composite index for user + created_at (most common sort)
CREATE INDEX IF NOT EXISTS idx_applications_user_created 
ON applications(user_id, created_at DESC);

-- Composite index for user + updated_at (recent activity)
CREATE INDEX IF NOT EXISTS idx_applications_user_updated 
ON applications(user_id, updated_at DESC);

-- Index for subscription lookups by user
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status 
ON user_subscriptions(user_id, status) 
WHERE status = 'active';

-- Index for profiles email lookups (used in auth)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email) 
WHERE email IS NOT NULL;

COMMIT;


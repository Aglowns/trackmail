-- Add API Keys Table for Gmail Add-on Authentication
-- API keys are simple, long-lived tokens that don't expire
-- They're easier to manage than JWT tokens for external integrations

BEGIN;

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'Gmail Add-on Key',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,  -- NULL means never expires
    
    -- Index for fast lookups
    CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on api_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Enable Row-Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own API keys
CREATE POLICY "Users can view own API keys"
    ON api_keys
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own API keys
CREATE POLICY "Users can create own API keys"
    ON api_keys
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own API keys
CREATE POLICY "Users can delete own API keys"
    ON api_keys
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Service role can read any API key (for validation)
-- This is needed for the backend to validate API keys
CREATE POLICY "Service role can read all API keys"
    ON api_keys
    FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');

COMMIT;


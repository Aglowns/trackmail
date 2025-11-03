-- Add API Keys Table for Gmail Add-on Authentication
-- API keys are simple, long-lived tokens that don't expire
-- They're easier to manage than JWT tokens for external integrations
-- Fully idempotent - safe to run multiple times

BEGIN;

-- Create table only if not exists (no FK inlined)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'Gmail Add-on Key',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Add named FK only if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE t.relname = 'api_keys'
      AND n.nspname = 'public'
      AND c.conname = 'api_keys_user_id_fkey'
  ) THEN
    ALTER TABLE public.api_keys
      ADD CONSTRAINT api_keys_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies (check if they exist before creating)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can view own API keys') THEN
    CREATE POLICY "Users can view own API keys"
      ON api_keys
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can create own API keys') THEN
    CREATE POLICY "Users can create own API keys"
      ON api_keys
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can delete own API keys') THEN
    CREATE POLICY "Users can delete own API keys"
      ON api_keys
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Service role can read all API keys') THEN
    CREATE POLICY "Service role can read all API keys"
      ON api_keys
      FOR SELECT
      USING (auth.jwt()->>'role' = 'service_role');
  END IF;
END;
$$;

COMMIT;

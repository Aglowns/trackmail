BEGIN;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS profession TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS notification_email TEXT,
    ADD COLUMN IF NOT EXISTS job_preferences JSONB;

COMMIT;

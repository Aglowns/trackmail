--
-- Migration: 0002_add_applied_at.sql
-- Purpose: Store the original email received date on applications
--

BEGIN;

ALTER TABLE public.applications
    ADD COLUMN IF NOT EXISTS applied_at timestamptz;

UPDATE public.applications
SET applied_at = created_at
WHERE applied_at IS NULL
  AND created_at IS NOT NULL;

COMMIT;



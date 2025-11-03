--
-- Migration: 0006_backfill_applied_at.sql
-- Purpose: Backfill applied_at dates from email received dates for existing applications
--

BEGIN;

-- Update applications that don't have applied_at set
-- Use the earliest email's received_at date if available, otherwise use created_at
UPDATE public.applications app
SET applied_at = COALESCE(
    -- Try to get the earliest email date for this application
    (SELECT MIN(em.received_at)
     FROM public.email_messages em
     WHERE em.application_id = app.id
       AND em.received_at IS NOT NULL),
    -- Fallback to created_at if no emails exist
    app.created_at
)
WHERE app.applied_at IS NULL;

COMMIT;


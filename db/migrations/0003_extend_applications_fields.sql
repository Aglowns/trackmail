--
-- Migration: 0003_extend_applications_fields.sql
-- Purpose: Add additional tracking fields for applications (source, confidence, salary range, ordering)
--

BEGIN;

ALTER TABLE public.applications
    ADD COLUMN IF NOT EXISTS source TEXT,
    ADD COLUMN IF NOT EXISTS confidence TEXT,
    ADD COLUMN IF NOT EXISTS salary_range TEXT,
    ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

UPDATE public.applications
SET order_index = COALESCE(order_index, 0);

CREATE INDEX IF NOT EXISTS idx_applications_order_index
    ON public.applications (order_index);

COMMIT;

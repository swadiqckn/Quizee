-- =========================================================
-- Add allow_public_registration and primary_color as direct columns in organisations table
-- =========================================================

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS allow_public_registration BOOLEAN DEFAULT TRUE NOT NULL,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366f1';

-- Backfill from settings jsonb if existing records exist
UPDATE public.organisations
SET 
  allow_public_registration = COALESCE((settings->>'allow_public_registration')::boolean, TRUE),
  primary_color = COALESCE(settings->>'primary_color', '#6366f1')
WHERE settings IS NOT NULL;

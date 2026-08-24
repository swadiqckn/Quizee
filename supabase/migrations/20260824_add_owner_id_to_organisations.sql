-- =========================================================
-- Add owner_id to organisations table to link an organization to its admin user
-- =========================================================

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organisations_owner_id ON public.organisations(owner_id);

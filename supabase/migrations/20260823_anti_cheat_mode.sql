-- =========================================================
-- MIGRATION: ANTI-CHEATING & PROCTORING MODE
-- Adds anti-cheat toggles and violation limits to quizzes,
-- adds flagged_for_cheating status to entries.
-- =========================================================

-- 1. Add anti-cheat configuration columns to quizzes table
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS anti_cheat_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS max_violations INTEGER DEFAULT 3 NOT NULL;

-- 2. Update entry_status enum with 'flagged_for_cheating'
DO $$ BEGIN
    ALTER TYPE entry_status ADD VALUE IF NOT EXISTS 'flagged_for_cheating';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add violations_count column to entries table for audit trail
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS violations_count INTEGER DEFAULT 0 NOT NULL;

-- 4. Comment on columns for schema documentation
COMMENT ON COLUMN public.quizzes.anti_cheat_enabled IS 'When true, enables client-side proctoring (tab blur, window switch, copy-paste protection)';
COMMENT ON COLUMN public.quizzes.max_violations IS 'Maximum number of proctoring violations allowed before auto-submitting the attempt as flagged';
COMMENT ON COLUMN public.entries.violations_count IS 'Number of anti-cheat violations logged during this quiz attempt';

-- =========================================================
-- Add Time Decay Reference Source and Floor Points Options
-- =========================================================

-- 1. Add decay configuration columns to quizzes table
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS decay_start_source TEXT DEFAULT 'question_open' NOT NULL,
  ADD COLUMN IF NOT EXISTS decay_min_points INTEGER DEFAULT 1 NOT NULL;

-- 2. Add decay configuration columns to tournament_rounds table
ALTER TABLE public.tournament_rounds
  ADD COLUMN IF NOT EXISTS decay_start_source TEXT DEFAULT 'question_open',
  ADD COLUMN IF NOT EXISTS decay_min_points INTEGER DEFAULT 1;

-- 3. Add client timing audit metadata column to entries table if not present
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS client_timings JSONB DEFAULT '{}'::jsonb;

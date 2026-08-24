-- =========================================================
-- MULTI-TENANT MCQ QUIZ & TOURNAMENT PLATFORM SCHEMA
-- Simple Username/Password (Participants) + Google Auth (Admins)
-- Free & Plus Subscription Plans (100 participants & 2 quizzes/mo limit)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'participant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('free', 'plus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE auth_provider_type AS ENUM ('credentials', 'google');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quiz_type AS ENUM ('single', 'tournament');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE progression_mode AS ENUM ('manual', 'automatic');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE scoring_strategy AS ENUM ('fixed', 'time_decay');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'live', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE round_status AS ENUM ('pending', 'active', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entry_status AS ENUM ('in_progress', 'submitted', 'disqualified', 'flagged_for_cheating');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ORGANISATIONS TABLE (Tenants with Free/Plus Plan & Quota Tracking)
CREATE TABLE IF NOT EXISTS public.organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    owner_id UUID UNIQUE, -- References users(id) (Each admin owns at most one organization)
    allow_public_registration BOOLEAN DEFAULT TRUE NOT NULL,
    primary_color TEXT DEFAULT '#6366f1',
    plan plan_type DEFAULT 'free' NOT NULL, -- 'free' (max 100 participants, 2 quizzes/mo) vs 'plus' (unlimited)
    quizzes_created_this_month INTEGER DEFAULT 0 NOT NULL,
    settings JSONB DEFAULT '{"primary_color": "#6366f1", "allow_public_registration": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS TABLE (Credentials for Participants, Google Login required for Admins)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- Nullable for Google Auth users
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'participant' NOT NULL,
    auth_provider auth_provider_type DEFAULT 'credentials' NOT NULL, -- 'google' for admins, 'credentials' for participants
    google_id TEXT UNIQUE,
    org_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    total_points NUMERIC DEFAULT 0 NOT NULL,
    total_referrals INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key linking organisations.owner_id to users.id
DO $$ BEGIN
    ALTER TABLE public.organisations
        ADD CONSTRAINT fk_organisations_owner_id
        FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_organisations_owner_id ON public.organisations(owner_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);

CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.users;

-- 4. QUIZZES TABLE (with Plan Participant Limits)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    banner_url TEXT,
    quiz_type quiz_type DEFAULT 'single' NOT NULL,
    progression_mode progression_mode DEFAULT 'manual' NOT NULL,
    scoring_strategy scoring_strategy DEFAULT 'fixed' NOT NULL,
    base_points_per_question NUMERIC DEFAULT 10 NOT NULL,
    time_limit_per_question_sec INTEGER DEFAULT 15 NOT NULL,
    total_time_limit_sec INTEGER,
    shuffle_questions BOOLEAN DEFAULT FALSE NOT NULL,
    shuffle_options BOOLEAN DEFAULT TRUE NOT NULL,
    enable_referral_bonus BOOLEAN DEFAULT FALSE NOT NULL,
    referral_bonus_points NUMERIC DEFAULT 10 NOT NULL,
    anti_cheat_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    max_violations INTEGER DEFAULT 3 NOT NULL,
    decay_start_source TEXT DEFAULT 'question_open' NOT NULL, -- 'question_open' vs 'scheduled_start'
    decay_min_points INTEGER DEFAULT 1 NOT NULL, -- Guaranteed floor points for correct answer after timer expires
    status quiz_status DEFAULT 'draft' NOT NULL,
    max_participants INTEGER DEFAULT 100, -- 100 for Free Plan, NULL for Plus Plan (unlimited)
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_org_id ON public.quizzes(org_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);

-- 5. TOURNAMENT ROUNDS TABLE
CREATE TABLE IF NOT EXISTS public.tournament_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    round_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    scheduled_start_time TIMESTAMPTZ,
    scheduled_end_time TIMESTAMPTZ,
    min_score_to_qualify NUMERIC DEFAULT 0,
    min_correct_to_qualify INTEGER DEFAULT 0,
    max_qualifiers INTEGER,
    status round_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (quiz_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_tournament_rounds_quiz_id ON public.tournament_rounds(quiz_id);

-- 6. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES public.tournament_rounds(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0 NOT NULL,
    question_text TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('image', 'audio', 'document', 'none')) DEFAULT 'none',
    points NUMERIC DEFAULT 10 NOT NULL,
    time_limit_sec INTEGER,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_round_id ON public.questions(round_id);

-- 7. ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES public.tournament_rounds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    score NUMERIC DEFAULT 0 NOT NULL,
    total_correct INTEGER DEFAULT 0 NOT NULL,
    total_time_taken_ms INTEGER DEFAULT 0 NOT NULL,
    qualified_for_next_round BOOLEAN DEFAULT FALSE NOT NULL,
    status entry_status DEFAULT 'in_progress' NOT NULL,
    violations_count INTEGER DEFAULT 0 NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    UNIQUE (quiz_id, round_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_entries_quiz_user ON public.entries(quiz_id, user_id);
CREATE INDEX IF NOT EXISTS idx_entries_score ON public.entries(quiz_id, score DESC, total_time_taken_ms ASC);

-- 8. QUESTION RESPONSES TABLE
CREATE TABLE IF NOT EXISTS public.question_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    selected_option_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    time_taken_ms INTEGER DEFAULT 0 NOT NULL,
    points_awarded NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (entry_id, question_id)
);

-- 9. WINNERS TABLE
CREATE TABLE IF NOT EXISTS public.winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES public.tournament_rounds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rank INTEGER NOT NULL,
    final_score NUMERIC NOT NULL,
    total_time_taken_ms INTEGER DEFAULT 0 NOT NULL,
    prize_or_badge TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (quiz_id, round_id, user_id)
);

-- 10. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    referee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    bonus_points_awarded NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

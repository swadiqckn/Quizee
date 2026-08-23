-- =========================================================
-- SEED DATA FOR DEMO & TESTING
-- Simple Username & Password Model
-- =========================================================

-- 1. Insert Sample Organizations
INSERT INTO public.organisations (id, name, slug, logo_url, settings)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Acme Tech Academy', 'acme-tech', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80', '{"primary_color": "#4f46e5", "allow_public_registration": true}'),
    ('22222222-2222-2222-2222-222222222222', 'Global Cyber Arena', 'cyber-arena', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&auto=format&fit=crop&q=80', '{"primary_color": "#059669", "allow_public_registration": true}')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Sample Users (Username + Password)
INSERT INTO public.users (id, username, password_hash, full_name, role, org_id, referral_code, total_points, total_referrals)
VALUES
    ('99999999-9999-9999-9999-999999999999', 'superadmin', 'password123', 'Elena Rostova', 'superadmin', NULL, 'SUPER99', 1500, 12),
    ('88888888-8888-8888-8888-888888888888', 'admin_marcus', 'password123', 'Prof. Marcus Vance', 'admin', '11111111-1111-1111-1111-111111111111', 'ACME2026', 420, 5),
    ('77777777-7777-7777-7777-777777777777', 'alexchen', 'password123', 'Alex Chen', 'participant', '11111111-1111-1111-1111-111111111111', 'ALEX2026', 340, 3),
    ('66666666-6666-6666-6666-666666666666', 'sarah_j', 'password123', 'Sarah Jenkins', 'participant', '11111111-1111-1111-1111-111111111111', 'SARAH88', 290, 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Sample Quizzes
-- Quiz 1: Multi-Round Tournament with Time-Decay Scoring
INSERT INTO public.quizzes (
    id,
    org_id,
    title,
    description,
    banner_url,
    quiz_type,
    progression_mode,
    scoring_strategy,
    base_points_per_question,
    time_limit_per_question_sec,
    shuffle_questions,
    shuffle_options,
    enable_referral_bonus,
    referral_bonus_points,
    status,
    created_by
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'AI & Web3 National Championship 2026',
    'A multi-level competitive tournament testing algorithmic knowledge, modern web systems, and AI fundamentals with speed-based points decay.',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    'tournament',
    'automatic',
    'time_decay',
    10,
    15,
    true,
    true,
    true,
    25,
    'published',
    '88888888-8888-8888-8888-888888888888'
) ON CONFLICT (id) DO NOTHING;

-- Quiz 2: Single Competition with Fixed Scoring
INSERT INTO public.quizzes (
    id,
    org_id,
    title,
    description,
    banner_url,
    quiz_type,
    progression_mode,
    scoring_strategy,
    base_points_per_question,
    time_limit_per_question_sec,
    shuffle_questions,
    shuffle_options,
    enable_referral_bonus,
    referral_bonus_points,
    status,
    created_by
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'Frontend Masters Flash Quiz',
    'Fast-paced single-round challenge covering React 19, TypeScript 5.7, and Next.js App Router performance optimizations.',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&auto=format&fit=crop&q=80',
    'single',
    'manual',
    'fixed',
    10,
    20,
    true,
    true,
    false,
    0,
    'published',
    '88888888-8888-8888-8888-888888888888'
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert Tournament Rounds for Quiz 1
INSERT INTO public.tournament_rounds (
    id,
    quiz_id,
    round_number,
    title,
    scheduled_start_time,
    scheduled_end_time,
    min_score_to_qualify,
    min_correct_to_qualify,
    max_qualifiers,
    status
) VALUES 
    (
        'rrrrrrrr-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        1,
        'Round 1: Speed Qualifier (Prelims)',
        NOW() - INTERVAL '1 hour',
        NOW() + INTERVAL '24 hours',
        6,
        1,
        100,
        'active'
    ),
    (
        'rrrrrrrr-2222-2222-2222-222222222222',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        2,
        'Round 2: Grand Finals & System Architecture',
        NOW() + INTERVAL '24 hours',
        NOW() + INTERVAL '48 hours',
        15,
        2,
        20,
        'pending'
    )
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Questions for Round 1
INSERT INTO public.questions (
    id,
    quiz_id,
    round_id,
    order_index,
    question_text,
    attachment_url,
    attachment_type,
    points,
    time_limit_sec,
    options,
    explanation
) VALUES 
    (
        'qqqqqqqq-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'rrrrrrrr-1111-1111-1111-111111111111',
        1,
        'What data structure does PostgreSQL utilize under the hood for standard primary key indexes?',
        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
        'image',
        10,
        15,
        '[
            {"id": "opt1", "text": "B-Tree", "is_correct": true, "explanation": "Postgres creates standard indexes as B-Trees by default."},
            {"id": "opt2", "text": "Hash Map", "is_correct": false},
            {"id": "opt3", "text": "Skip List", "is_correct": false},
            {"id": "opt4", "text": "Red-Black Tree", "is_correct": false}
        ]'::jsonb,
        'Postgres defaults to B-Tree index structures for primary key constraints and general indexing.'
    ),
    (
        'qqqqqqqq-2222-2222-2222-222222222222',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'rrrrrrrr-1111-1111-1111-111111111111',
        2,
        'Which Next.js feature renders components on the server without shipping JavaScript bundles to the browser client?',
        NULL,
        'none',
        10,
        15,
        '[
            {"id": "opt1", "text": "React Server Components (RSC)", "is_correct": true, "explanation": "RSCs execute only on the server and do not add to client JS bundle size."},
            {"id": "opt2", "text": "Server-side State Hook (useServerState)", "is_correct": false},
            {"id": "opt3", "text": "Edge Middleware Proxy", "is_correct": false},
            {"id": "opt4", "text": "Hydration Bypass Tokens", "is_correct": false}
        ]'::jsonb,
        'React Server Components execute server-side and produce zero client JS bundle.'
    )
ON CONFLICT (id) DO NOTHING;

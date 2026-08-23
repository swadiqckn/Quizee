# 🏆 Quizee - Multi-Tenant MCQ Quiz & Tournament Platform

A multi-tenant MCQ Quiz and Tournament Platform built with **Next.js 14 (App Router, TypeScript, Tailwind CSS)** and **Supabase (PostgreSQL, Row Level Security, Auth, and Storage)**.

---

## 🌟 Key Features

### 1. Multi-Tenancy & Multi-Role System
- **Organizations (Tenants)**: Isolated tenant workspaces with unique subdomain/slugs and custom branding.
- **Roles**:
  - `superadmin`: Global tenant management, platform metrics, and system configuration.
  - `admin` (Organizer / Quiz Host): Quiz creation, question management, tournament round scheduling, and live participant monitoring.
  - `participant`: Join competitions, play in real-time arenas, qualify across tournament levels, and earn referral bonuses.
- **Interactive Role Switcher**: Switch between Superadmin, Admin, and Participant directly from the top navigation bar to test all perspectives.

---

### 2. Competition & Tournament Engine
- **Single Competition vs. Multi-Round Tournament**:
  - **Single Competition**: Standalone fast-paced challenge with instant leaderboards.
  - **Multi-Round / Multi-Level Tournament**: Progressive stages (e.g., *Round 1: Speed Prelims $\rightarrow$ Round 2: Grand Finals*).
- **Tournament Progression Modes**:
  - **Automatic**: Scheduled start and end dates/times per round. Participants meeting qualification thresholds automatically unlock subsequent stages.
  - **Manual**: Organizers review live leaderboard entries and manually approve qualifiers.
- **Qualification Threshold Rules**:
  - Minimum score requirement (e.g. Min 8 points).
  - Minimum correct answers requirement (e.g. Min 2 correct).
  - Max qualifiers cut-off (e.g. Top 50 advance).

---

### 3. Pointing & Scoring Engines
- **Time-Decay Dynamic Scoring (Speed-based decrement)**:
  - Higher points awarded for fast responses.
  - Decrements continuously during the question timer (e.g., a 10s question with base 10 points answered at 6s awards 4 points).
  - Live potential point ticker displayed during the quiz.
- **Fixed Points**: Standard fixed points per correct answer regardless of response duration.

---

### 4. Anti-Cheat & Smart Randomization
- **Option Shuffle**: Automatically shuffles MCQ choices for every contestant session (enabled by default).
- **Question Shuffle**: Optional random question order per participant.

---

### 5. Rich Media Questions
- Support for question text + **Media Attachments** (diagrams, photos, audio clips, and documents).
- Fullscreen zoom viewer for technical diagrams.
- Detailed explanation for each MCQ choice on result review.

---

### 6. Viral Referral & Growth Rewards
- Unique referral code and shareable invite link for every registered user.
- Configurable referral bonus points (e.g. $+25\text{ pts}$ per invite).
- Referral hub with one-click link copying, claim code box, and invitation analytics.

---

## 🗄️ Database Tables (`supabase/schema.sql`)

1. `organisations` - Tenant organizations with custom settings and slugs.
2. `profiles` - Extended user profiles linked to Supabase Auth with roles and referral codes.
3. `quizzes` - Competitions and tournaments with full scoring and progression configs.
4. `tournament_rounds` - Multi-level tournament rounds, schedules, and qualification criteria.
5. `questions` - Question bank with MCQ choices, media attachments, and explanations.
6. `entries` - Participant attempts, scores, speed metrics, and qualification flags.
7. `question_responses` - Per-question answers, time taken, and awarded points.
8. `winners` - Leaderboard standings and prize/badge allocations.
9. `referrals` - Referral relationships and bonus points attribution.

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Connecting Real Supabase Database
1. Create a project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and execute:
   - `supabase/schema.sql` (Tables, enums, triggers, and Row Level Security policies)
   - `supabase/seed.sql` (Sample demo organizations, tournaments, and questions)
3. Copy your project credentials into `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📂 Project Directory Structure

```
Quiz/
├── app/
│   ├── (admin)/
│   │   ├── dashboard/page.tsx           # Organizer metrics & competition list
│   │   └── quizzes/
│   │       ├── new/page.tsx             # Quiz Creation Wizard
│   │       └── [quizId]/
│   │           ├── questions/page.tsx   # Question bank & media attachment manager
│   │           ├── rounds/page.tsx      # Tournament schedule & qualification manager
│   │           └── live-monitor/page.tsx# Real-time submission feed & qualifier controls
│   ├── (participant)/
│   │   ├── explore/page.tsx             # Filter & discover competitions
│   │   ├── quiz/[quizId]/
│   │   │   ├── page.tsx                 # Quiz overview & tournament bracket
│   │   │   ├── play/page.tsx            # Real-time Quiz Arena (Time-decay, attachments)
│   │   │   └── results/page.tsx         # Results, qualification banner & leaderboard
│   │   └── referrals/page.tsx           # Referral hub & reward claims
│   ├── superadmin/page.tsx              # Multi-tenant organization manager
│   ├── api/quizzes/submit/route.ts      # Server-side score validation endpoint
│   ├── layout.tsx                       # Root layout with platform provider & Navbar
│   └── page.tsx                         # Landing page
├── components/
│   └── shared/
│       └── Navbar.tsx                   # Tenant selector & role switcher
├── lib/
│   ├── context.tsx                      # Platform state store & quiz simulation engine
│   ├── scoring.ts                       # Time-decay formula & qualification evaluator
│   ├── types.ts                         # TypeScript entity definitions
│   ├── mock-data.ts                     # Rich seed dataset for instant testing
│   └── utils.ts
├── supabase/
│   ├── schema.sql                       # Complete PostgreSQL schema with RLS & triggers
│   └── seed.sql                         # Demo seed data
└── README.md
```

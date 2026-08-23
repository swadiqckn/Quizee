'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Zap,
  Clock,
  Layers,
  Sparkles,
  Users,
  Award,
  ArrowRight,
  Shield,
  Shuffle,
  ChevronRight,
  Flame,
  Building2,
  CheckCircle2,
  Crown,
  Eye,
  BarChart3,
  Globe2,
  Calendar,
  Share2,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';

export default function HomePage() {
  const { quizzes, organisations, currentUser } = useQuizPlatform();
  const [activeTab, setActiveTab] = useState<'tournament' | 'scoring' | 'monitor' | 'referrals'>('tournament');

  const publishedQuizzes = quizzes.filter((q) => q.status === 'published' || q.status === 'live');
  const tournaments = publishedQuizzes.filter((q) => q.quiz_type === 'tournament');

  return (
    <div className="space-y-24 pb-12">
      {/* 1. Hero Section (Organization & SaaS Focused) */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-900 bg-gradient-to-b from-indigo-950/25 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(99,102,241,0.18),rgba(255,255,255,0))]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide shadow-inner">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Multi-Tenant Tournament & Assessment Platform for Organizations
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Host Multi-Round Championships & Assessments for{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Your Organization
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-xl leading-relaxed max-w-3xl mx-auto">
              Empower universities, tech communities, schools, and companies to run automated multi-level tournaments, speed-decay scoring engines, and live qualifier controls under your own tenant workspace.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href={currentUser ? (currentUser.role === 'admin' ? '/admin/dashboard' : '/explore') : '/login'}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <Building2 className="w-4 h-4" />
                Host a Competition (Free)
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm transition"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Explore Live Arenas
              </Link>

              <Link
                href="/admin/billing"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
              >
                <Crown className="w-4 h-4 text-indigo-400" />
                Free vs Plus Plans
              </Link>
            </div>

            {/* Quick Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Multi-Level Brackets
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Time-Decay Scoring
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Anti-Cheat Shuffling
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Viral Referral Rewards
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Organization Value Propositions Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Enterprise Grade Architecture
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Everything Your Organization Needs to Run Elite Competitions
          </h2>
          <p className="text-slate-400 text-sm">
            From single flash quizzes to multi-stage national hackathons, Quizee handles the complete assessment lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Multi-Round Tournaments */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Stage Tournament Brackets</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Create multi-round competitions (Prelims $\to$ Semi-Finals $\to$ Finals). Set automatic time-based schedule unlocks and minimum qualification score cutoffs.
            </p>
          </div>

          {/* Card 2: Time-Decay Dynamic Scoring */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Dynamic Speed-Decay Scoring</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Reward fast thinkers and eliminate leaderboard ties. Points decrement dynamically in real-time as question seconds elapse (e.g. 10s question answered in 6s earns 4 pts).
            </p>
          </div>

          {/* Card 3: Multi-Tenancy & Tenant Branding */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Isolated Tenant Organizations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Each school, academy, or company operates in its own dedicated tenant namespace with custom branding colors, logo, and private contestant rosters.
            </p>
          </div>

          {/* Card 4: Anti-Cheat Randomization */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Shuffle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Anti-Cheat Randomization</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Options shuffle per contestant by default. Randomize question sequence dynamically to ensure testing integrity during synchronized exam windows.
            </p>
          </div>

          {/* Card 5: Rich Media Attachments */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Technical Diagrams & Media</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Attach zoomable architecture diagrams, charts, photos, and audio clips to questions with comprehensive explanations upon result review.
            </p>
          </div>

          {/* Card 6: Viral Referral Growth */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Viral Referral Growth System</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Boost competition turnout automatically. Contestants earn referral bonus points when inviting classmates and peers via unique shareable links.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Interactive Organizer Suite Showcase (Tabbed Product Preview) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Host Control Suite
          </span>
          <h2 className="text-3xl font-extrabold text-white">Built for Effortless Host Orchestration</h2>
          <p className="text-sm text-slate-400">
            Preview the powerful administrative controls available to tournament organizers.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('tournament')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'tournament'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Tournament Scheduler
          </button>

          <button
            onClick={() => setActiveTab('scoring')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'scoring'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            Time-Decay Engine
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'monitor'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            Live Submissions & Qualifiers
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'referrals'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Referral Incentives
          </button>
        </div>

        {/* Tab Preview Display */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {activeTab === 'tournament' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Multi-Round Tournament Schedule</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Automated progression across qualification stages</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                  Mode: Automatic Time-Lock
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase">Level 1: Speed Prelims</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">Min 8 points & 1 correct answer to qualify for Finals.</p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cutoff window: 24 hours</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase">Level 2: Grand Finals</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                      AUTO-SCHEDULED
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">Automatically unlocks for qualified contestants at scheduled time.</p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Starts in 24 hours • Top 10 Max Qualifiers</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white">Dynamic Time-Decay Formula</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time point depreciation based on response speed</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400">Answered at 0s (Instant)</span>
                  <p className="text-2xl font-black text-emerald-400">10 / 10 pts</p>
                  <p className="text-[10px] text-slate-500">100% max score awarded</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400">Answered at 6s (on 10s timer)</span>
                  <p className="text-2xl font-black text-amber-400">4 / 10 pts</p>
                  <p className="text-[10px] text-slate-500">Decayed proportionally</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400">Answered at 9.5s (Last second)</span>
                  <p className="text-2xl font-black text-indigo-400">1 / 10 pts</p>
                  <p className="text-[10px] text-slate-500">Guaranteed minimum floor</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitor' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Real-Time Submissions Feed</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Live contestant standings and manual qualifier overrides</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Sync
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-slate-950 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center">
                      #1
                    </span>
                    <div>
                      <p className="font-semibold text-white">Alex Chen (@alexchen)</p>
                      <p className="text-[10px] text-slate-400">Speed: 12.4s • 3/3 Correct</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-indigo-400">26 pts</span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">
                      Qualified
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-300/20 text-slate-200 font-bold flex items-center justify-center">
                      #2
                    </span>
                    <div>
                      <p className="font-semibold text-white">Sarah Jenkins (@sarah_j)</p>
                      <p className="text-[10px] text-slate-400">Speed: 18.2s • 2/3 Correct</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-indigo-400">19 pts</span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">
                      Qualified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white">Viral Referral Growth Mechanics</h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated attribution and bonus points incentives</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-pink-400">Referrer Reward</span>
                  <p className="text-2xl font-black text-white">+25 Points</p>
                  <p className="text-xs text-slate-400">Credited to referring contestant upon referee registration.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-indigo-400">Referee Welcome Bonus</span>
                  <p className="text-2xl font-black text-white">+10 Points</p>
                  <p className="text-xs text-slate-400">Instant welcome bonus applied to referee profile balance.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Plans & Pricing Overview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Simple, Transparent Plans
          </span>
          <h2 className="text-3xl font-extrabold text-white">Built to Scale with Your Organization</h2>
          <p className="text-sm text-slate-400">
            Start completely free for classroom assessments or upgrade to Plus for unlimited tournament scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                Free Starter
              </span>
              <div>
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-slate-400 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400">Ideal for small classroom assessments and single challenges</p>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <strong>Max 100 participants</strong> per competition
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <strong>Max 2 quizzes</strong> created per month
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Fixed & Time-decay scoring engines
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Standard leaderboards & rankings
                </li>
              </ul>
            </div>

            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Plus Plan */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border border-amber-500/40 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-l from-amber-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-bl-xl">
              Most Popular
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Plus Pro
              </span>
              <div>
                <span className="text-4xl font-black text-white">$29</span>
                <span className="text-xs text-slate-400 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400">Unlimited power for campuses, leagues & hackathons</p>

              <ul className="space-y-3 text-xs text-slate-200 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2.5 text-amber-300 font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <strong>Unlimited participants</strong> per competition
                </li>
                <li className="flex items-center gap-2.5 text-amber-300 font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <strong>Unlimited quizzes & tournaments</strong> per month
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Multi-level scheduled tournament brackets
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Rich media diagrams & audio attachments
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Viral referral bonus reward engine
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Priority live contestant monitoring & CSV exports
                </li>
              </ul>
            </div>

            <Link
              href="/admin/billing"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs text-center shadow-lg shadow-indigo-600/30 transition block"
            >
              Upgrade to Plus Plan ($29/mo)
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Organization Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-slate-900 border border-indigo-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Ready to Host Your Organization's Next Competition?
            </h2>
            <p className="text-sm text-slate-300">
              Create your organization tenant workspace in seconds. Configure tournament brackets, dynamic scoring, and launch live arenas effortlessly.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-xl transition hover:scale-105"
            >
              Get Started Now (Free)
            </Link>
            <Link
              href="/explore"
              className="px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold transition"
            >
              Browse Public Competitions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

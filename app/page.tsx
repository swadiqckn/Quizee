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
  GraduationCap,
  Sparkle,
  Compass,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';

export default function HomePage() {
  const { quizzes, currentUser } = useQuizPlatform();
  const [activeTab, setActiveTab] = useState<'tournament' | 'scoring' | 'monitor' | 'referrals'>('tournament');

  return (
    <div className="space-y-24 pb-16">
      {/* 1. Hero Section (Matched to Quizly-style warm grid and speech bubble design) */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Subtle Watermark Question Mark in background like screenshot */}
        <div className="absolute right-4 sm:right-24 top-12 select-none pointer-events-none opacity-[0.07] font-bold text-[22rem] sm:text-[30rem] leading-none text-[#e05a38] font-serif">
          ?
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline & Action Buttons */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fff0ea] border border-[#ffd8cb] text-[#c2411d] text-xs font-bold uppercase tracking-wider shadow-sm">
                <GraduationCap className="w-4 h-4 text-[#e05a38]" />
                FOR ORGANIZATIONS & SCHOOLS
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.08]">
                One platform <br />
                for <span className="text-[#e05a38]">competitions</span>
              </h1>

              {/* Description */}
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
                Multi-level tournament brackets, millisecond-precision speed decay scoring, live contestant monitoring, and instant leaderboards—built right in for schools, hackathons & academies.
              </p>

              {/* Dual Action Buttons (Styled directly from screenshot reference) */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {/* Primary Button: Terracotta Box */}
                <Link
                  href={currentUser?.role === 'admin' ? '/admin/dashboard' : '/register'}
                  className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white shadow-xl shadow-[#e05a38]/25 transition-all hover:scale-[1.02] text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">Register your organization</p>
                    <p className="text-[11px] text-white/80 font-medium">Batches, tests and rankings</p>
                  </div>
                </Link>

                {/* Secondary Button: Clean Outlined Card */}
                <Link
                  href="/explore"
                  className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 shadow-md transition-all hover:scale-[1.02] text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">Explore live quizzes</p>
                    <p className="text-[11px] text-slate-500 font-medium">For students and guests</p>
                  </div>
                </Link>
              </div>

              {/* Features List */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#e05a38]" />
                  Multi-Level Brackets
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#e05a38]" />
                  Time-Decay Scoring
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#e05a38]" />
                  Anti-Cheat Shuffling
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#e05a38]" />
                  Viral Referrals
                </span>
              </div>
            </div>

            {/* Right Column: Floating Benefit Cards / Speech Bubbles (Exact quizly.app style) */}
            <div className="lg:col-span-5 relative space-y-4">
              {/* Bubble 1: School / Org */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#fff9f6] border-2 border-[#e05a38] shadow-lg max-w-sm ml-auto relative transition hover:-translate-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e05a38] block mb-1">
                  ORGANIZATION / SCHOOL
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  How do we automate multi-round tournament progression & prelims?
                </p>
              </div>

              {/* Bubble 2: Teacher / Examiner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#faf5ff] border-2 border-[#8b5cf6] shadow-lg max-w-sm mr-auto relative transition hover:-translate-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b5cf6] block mb-1">
                  EXAMINER / HOST
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Can speed-decay scoring eliminate tied leaderboards with millisecond accuracy?
                </p>
              </div>

              {/* Bubble 3: Student / Participant */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#f0fdf4] border-2 border-[#10b981] shadow-lg max-w-sm ml-auto relative transition hover:-translate-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10b981] block mb-1">
                  CONTESTANT
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Instant Google one-click join, live ticker points and question explanations!
                </p>
              </div>

              {/* Bubble 4: Referrals */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#fffbeb] border-2 border-[#f59e0b] shadow-lg max-w-sm mr-auto relative transition hover:-translate-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#d97706] block mb-1">
                  REFERRALS & GROWTH
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Students earn +25 bonus points when inviting classmates to participate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Value Propositions Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff0ea] border border-[#ffd5c4] text-[#c2411d] text-xs font-bold uppercase tracking-wider">
            Enterprise Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Everything Your Organization Needs to Run Elite Competitions
          </h2>
          <p className="text-slate-600 text-sm">
            From single flash quizzes to multi-stage national hackathons, Quizee handles the complete competition lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Multi-Round Tournaments */}
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm hover:shadow-xl hover:border-[#e05a38]/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center text-[#e05a38] group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Multi-Stage Tournament Brackets</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Create multi-round competitions (Prelims $\to$ Semi-Finals $\to$ Finals). Set automatic time-based schedule unlocks and minimum qualification score cutoffs.
            </p>
          </div>

          {/* Card 2: Time-Decay Dynamic Scoring */}
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm hover:shadow-xl hover:border-[#8b5cf6]/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f5f3ff] border border-[#ddd6fe] flex items-center justify-center text-[#8b5cf6] group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dynamic Speed-Decay Scoring</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Reward fast thinkers and eliminate leaderboard ties. Points decrement dynamically in real-time as question seconds elapse (e.g. 10s question answered in 6s earns 4 pts).
            </p>
          </div>

          {/* Card 3: Multi-Tenancy & Tenant Branding */}
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm hover:shadow-xl hover:border-[#ec4899]/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fdf2f8] border border-[#fbcfe8] flex items-center justify-center text-[#ec4899] group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Isolated Tenant Organizations</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Each school, academy, or company operates in its own dedicated tenant namespace with custom branding colors, logo, and private contestant rosters.
            </p>
          </div>

          {/* Card 4: Anti-Cheat Randomization */}
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm hover:shadow-xl hover:border-[#f59e0b]/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center text-[#f59e0b] group-hover:scale-110 transition-transform">
              <Shuffle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Anti-Cheat Randomization</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Options shuffle per contestant by default. Randomize question sequence dynamically to ensure testing integrity during synchronized exam windows.
            </p>
          </div>

          {/* Card 5: Rich Media Attachments */}
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm hover:shadow-xl hover:border-[#10b981]/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#10b981] group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Technical Diagrams & Media</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Attach zoomable architecture diagrams, charts, photos, and audio clips to questions with comprehensive explanations upon result review.
            </p>
          </div>

          {/* Card 6: Viral Referral Growth */}
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm hover:shadow-xl hover:border-[#3b82f6]/40 transition group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#3b82f6] group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Viral Referral Growth System</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Boost competition turnout automatically. Contestants earn referral bonus points when inviting classmates and peers via unique shareable links.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Interactive Organizer Suite Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#e05a38]">
            Host Control Suite
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Built for Effortless Host Orchestration
          </h2>
          <p className="text-sm text-slate-600">
            Preview the administrative controls available to tournament organizers.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('tournament')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'tournament'
                ? 'bg-[#e05a38] text-white shadow-lg shadow-[#e05a38]/25'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-[#ebdcd1]'
            }`}
          >
            <Layers className="w-4 h-4" />
            Tournament Scheduler
          </button>

          <button
            onClick={() => setActiveTab('scoring')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'scoring'
                ? 'bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-[#ebdcd1]'
            }`}
          >
            <Zap className="w-4 h-4" />
            Time-Decay Engine
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'monitor'
                ? 'bg-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/25'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-[#ebdcd1]'
            }`}
          >
            <Eye className="w-4 h-4" />
            Live Submissions & Qualifiers
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'referrals'
                ? 'bg-[#ec4899] text-white shadow-lg shadow-[#ec4899]/25'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-[#ebdcd1]'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Referral Incentives
          </button>
        </div>

        {/* Tab Preview Display */}
        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
          {activeTab === 'tournament' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Multi-Round Tournament Schedule</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Automated progression across qualification stages</p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-[#f5f3ff] border border-[#ddd6fe] text-[#7c3aed] text-xs font-bold">
                  Mode: Automatic Time-Lock
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#15803d] uppercase">Level 1: Speed Prelims</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#dcfce7] text-[#15803d] font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Min 8 points & 1 correct answer to qualify for Finals.</p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#15803d]" />
                    <span>Cutoff window: 24 hours</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#fffbeb] border border-[#fde68a] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#b45309] uppercase">Level 2: Grand Finals</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#fef3c7] text-[#b45309] font-bold">
                      AUTO-SCHEDULED
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Automatically unlocks for qualified contestants at scheduled time.</p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#b45309]" />
                    <span>Starts in 24 hours • Top 10 Max Qualifiers</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Dynamic Time-Decay Formula</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time point depreciation based on response speed</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] space-y-2">
                  <span className="text-[11px] font-bold text-slate-600">Answered at 0s (Instant)</span>
                  <p className="text-3xl font-bold text-[#15803d]">10 / 10 pts</p>
                  <p className="text-[10px] text-slate-500 font-medium">100% max score awarded</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#fffbeb] border border-[#fde68a] space-y-2">
                  <span className="text-[11px] font-bold text-slate-600">Answered at 6s (on 10s timer)</span>
                  <p className="text-3xl font-bold text-[#b45309]">4 / 10 pts</p>
                  <p className="text-[10px] text-slate-500 font-medium">Decayed proportionally</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] space-y-2">
                  <span className="text-[11px] font-bold text-slate-600">Answered at 9.5s (Last second)</span>
                  <p className="text-3xl font-bold text-[#c2411d]">1 / 10 pts</p>
                  <p className="text-[10px] text-slate-500 font-medium">Guaranteed minimum floor</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitor' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Real-Time Submissions Feed</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Live contestant standings and manual qualifier overrides</p>
                </div>
                <span className="text-xs font-mono text-[#15803d] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#15803d] animate-ping"></span>
                  Live Sync Active
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-[#fef3c7] text-[#b45309] font-bold flex items-center justify-center">
                      #1
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Alex Chen (@alexchen)</p>
                      <p className="text-[10px] text-slate-500 font-medium">Speed: 12.4s • 3/3 Correct</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#e05a38] text-sm">26 pts</span>
                    <span className="px-3 py-1 rounded-xl bg-[#15803d] text-white text-[10px] font-bold">
                      Qualified
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center">
                      #2
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Sarah Jenkins (@sarah_j)</p>
                      <p className="text-[10px] text-slate-500 font-medium">Speed: 18.2s • 2/3 Correct</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#e05a38] text-sm">19 pts</span>
                    <span className="px-3 py-1 rounded-xl bg-[#15803d] text-white text-[10px] font-bold">
                      Qualified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Viral Referral Growth Mechanics</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated attribution and bonus points incentives</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] space-y-2">
                  <span className="text-xs font-bold text-[#c2411d]">Referrer Reward</span>
                  <p className="text-3xl font-bold text-slate-900">+25 Points</p>
                  <p className="text-xs text-slate-600">Credited to referring contestant upon referee registration.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] space-y-2">
                  <span className="text-xs font-bold text-[#15803d]">Referee Welcome Bonus</span>
                  <p className="text-3xl font-bold text-slate-900">+10 Points</p>
                  <p className="text-xs text-slate-600">Instant welcome bonus applied to referee profile balance.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Plans & Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#e05a38]">
            Simple, Transparent Plans
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Built to Scale with Your Organization
          </h2>
          <p className="text-sm text-slate-600">
            Start free for classroom quizzes or scale with Plus for unlimited tournaments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                Free Starter
              </span>
              <div>
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-xs text-slate-500 ml-1 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-slate-600">Ideal for small classroom assessments and single challenges</p>

              <ul className="space-y-3 text-xs text-slate-700 pt-4 border-t border-slate-100 font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  <strong>Max 100 participants</strong> per competition
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  <strong>Max 2 quizzes</strong> created per month
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  Fixed & Time-decay scoring engines
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  Standard leaderboards & rankings
                </li>
              </ul>
            </div>

            <Link
              href="/register"
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs text-center transition block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Plus Plan */}
          <div className="p-8 rounded-3xl bg-[#fff9f6] border-2 border-[#e05a38] flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1 bg-[#e05a38] text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
              Most Popular
            </div>

            <div className="space-y-4">
              <span className="px-3.5 py-1.5 rounded-full bg-[#fff0ea] border border-[#ffd8cb] text-[#c2411d] text-xs font-bold inline-flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#e05a38]" /> Plus Pro
              </span>
              <div>
                <span className="text-4xl font-bold text-slate-900">$29</span>
                <span className="text-xs text-slate-500 ml-1 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-slate-600">Unlimited power for campuses, leagues & hackathons</p>

              <ul className="space-y-3 text-xs text-slate-800 pt-4 border-t border-[#ffd8cb] font-medium">
                <li className="flex items-center gap-2.5 text-[#c2411d] font-bold">
                  <Sparkles className="w-4 h-4 text-[#e05a38] shrink-0" />
                  <strong>Unlimited participants</strong> per competition
                </li>
                <li className="flex items-center gap-2.5 text-[#c2411d] font-bold">
                  <Sparkles className="w-4 h-4 text-[#e05a38] shrink-0" />
                  <strong>Unlimited quizzes & tournaments</strong> per month
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  Multi-level scheduled tournament brackets
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  Rich media diagrams & audio attachments
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  Viral referral bonus reward engine
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  Priority live contestant monitoring & CSV exports
                </li>
              </ul>
            </div>

            <Link
              href="/admin/billing"
              className="w-full py-3.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs text-center shadow-lg shadow-[#e05a38]/30 transition block"
            >
              Upgrade to Plus Plan ($29/mo)
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-10 sm:p-14 rounded-3xl bg-[#fff5f0] border-2 border-[#ffd8cb] text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Ready to Host Your Next Championship?
            </h2>
            <p className="text-sm text-slate-600">
              Create your organization tenant workspace in seconds. Configure tournament brackets, dynamic scoring, and launch live arenas effortlessly.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-8 py-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-sm shadow-xl shadow-[#e05a38]/25 transition hover:scale-105"
            >
              Register Organization (Free)
            </Link>
            <Link
              href="/explore"
              className="px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold transition"
            >
              Browse Public Competitions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

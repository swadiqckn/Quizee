'use client';

import React from 'react';
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
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';

export default function HomePage() {
  const { quizzes, currentUser } = useQuizPlatform();
  const publishedQuizzes = quizzes.filter((q) => q.status === 'published' || q.status === 'live');
  const tournaments = publishedQuizzes.filter((q) => q.quiz_type === 'tournament');
  const singleQuizzes = publishedQuizzes.filter((q) => q.quiz_type === 'single');

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-900 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Next-Gen Multi-Tenant MCQ Arena & Tournaments
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Compete, Qualify & Conquer in{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Real-Time Arenas
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              Experience dynamic speed-decay scoring, multi-level tournament qualification brackets, rich media attachments, and viral referral incentives in one unified multi-tenant platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
              >
                <Zap className="w-4 h-4" />
                Browse Live Quizzes
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/referrals"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm transition"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Referral Hub & Points
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Time-Decay Dynamic Scoring</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Speed matters. Points decrease continuously as time ticks down (e.g. answer in 6s for a 10s question to earn 4 points).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Round Tournaments</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Run automated or manual round progressions with custom score thresholds, minimum correct answers, and cutoff caps.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-pink-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shuffle className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Randomization & Media</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Questions & options shuffle per participant to prevent cheating. Rich attachment support for diagrams, images, and audio.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Tournaments Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 text-orange-400" />
              High Stakes Arenas
            </div>
            <h2 className="text-2xl font-extrabold text-white">Multi-Round Championship Tournaments</h2>
          </div>
          <Link
            href="/explore"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((quiz) => (
            <div
              key={quiz.id}
              className="group relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Multi-Round Tournament
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium">
                    {quiz.scoring_strategy === 'time_decay' ? '⚡ Time-Decay Scoring' : '🎯 Fixed Scoring'}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition">
                    {quiz.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{quiz.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <p className="text-[11px] text-slate-500">Rounds</p>
                    <p className="text-sm font-bold text-white">{quiz.rounds?.length || 2} Levels</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <p className="text-[11px] text-slate-500">Time / Q</p>
                    <p className="text-sm font-bold text-white">{quiz.time_limit_per_question_sec}s</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <p className="text-[11px] text-slate-500">Ref Bonus</p>
                    <p className="text-sm font-bold text-emerald-400">+{quiz.referral_bonus_points} pts</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-xs text-slate-400 font-medium">
                    Progression: <strong className="text-slate-200 capitalize">{quiz.progression_mode}</strong>
                  </span>
                </div>
                <Link
                  href={`/quiz/${quiz.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition shadow-md shadow-indigo-600/20"
                >
                  Enter Tournament
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Single Speed Challenges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            Quick Fire
          </div>
          <h2 className="text-2xl font-extrabold text-white">Single Standalone Challenges</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {singleQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 text-[11px] font-semibold">
                    Single Competition
                  </span>
                  <span className="text-xs text-slate-400">{quiz.time_limit_per_question_sec}s / question</span>
                </div>
                <h3 className="text-base font-bold text-white">{quiz.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{quiz.description}</p>
              </div>

              <div className="pt-6">
                <Link
                  href={`/quiz/${quiz.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
                >
                  Play Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

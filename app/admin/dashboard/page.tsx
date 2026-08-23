'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Layers,
  Zap,
  Users,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  Settings,
  HelpCircle,
  Clock,
  CheckCircle,
  Eye,
  Gift,
  Crown,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatDate } from '@/lib/utils';
import { PLAN_CONFIG, PlanType } from '@/lib/types';

export default function AdminDashboardPage() {
  const { quizzes, entries, referrals, activeOrg, currentUser, canCreateQuiz } = useQuizPlatform();

  const orgQuizzes = quizzes.filter((q) => !activeOrg || q.org_id === activeOrg.id);
  const totalEntries = entries.length;
  const tournamentsCount = orgQuizzes.filter((q) => q.quiz_type === 'tournament').length;
  const singleCount = orgQuizzes.filter((q) => q.quiz_type === 'single').length;

  const currentPlan: PlanType = activeOrg?.plan || 'free';
  const quota = canCreateQuiz();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <span>Organizer Portal</span>
            <span>•</span>
            <span className="text-white">{activeOrg?.name || 'All Organizations'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Competitions Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/billing"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Manage Plan</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                currentPlan === 'plus'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {currentPlan}
            </span>
          </Link>

          <Link
            href="/admin/quizzes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create Competition
          </Link>
        </div>
      </div>

      {/* Plan Quota Alert Banner if near or at limit */}
      {currentPlan === 'free' && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Free Plan: {quota.currentCount} / {quota.maxAllowed} Quizzes Created This Month
              </p>
              <p className="text-[11px] text-slate-400">
                Free plan includes max 100 participants per competition. Upgrade to Plus for unlimited quizzes and participants.
              </p>
            </div>
          </div>

          <Link
            href="/admin/billing"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shrink-0 shadow-sm"
          >
            Upgrade to Plus ($29/mo)
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Competitions</span>
            <Trophy className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{orgQuizzes.length}</p>
          <p className="text-[11px] text-slate-500">{tournamentsCount} Tournaments, {singleCount} Single</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Participant Runs</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalEntries}</p>
          <p className="text-[11px] text-slate-500">Live submissions recorded</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Participant Cap</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400">
            {currentPlan === 'free' ? '100 / quiz' : 'Unlimited'}
          </p>
          <p className="text-[11px] text-slate-500">{currentPlan === 'free' ? 'Free Plan Cap' : 'Plus Plan Active'}</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Referral Invites</span>
            <Gift className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-3xl font-extrabold text-pink-400">{referrals.length}</p>
          <p className="text-[11px] text-slate-500">Viral network participants</p>
        </div>
      </div>

      {/* Competitions Management Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Your Competitions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage tournament levels, questions, and live monitors</p>
          </div>
          <Link
            href="/admin/quizzes/new"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            New Quiz <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/80">
          {orgQuizzes.map((quiz) => (
            <div key={quiz.id} className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      quiz.quiz_type === 'tournament'
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    }`}
                  >
                    {quiz.quiz_type}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                    {quiz.scoring_strategy === 'time_decay' ? '⚡ Time-Decay' : '🎯 Fixed'}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-emerald-400">
                    {quiz.status}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                    Max: {quiz.max_participants ? `${quiz.max_participants} users` : 'Unlimited'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{quiz.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-1">{quiz.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/quizzes/${quiz.id}/questions`}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  Questions ({quiz.questions_count || 0})
                </Link>

                {quiz.quiz_type === 'tournament' && (
                  <Link
                    href={`/admin/quizzes/${quiz.id}/rounds`}
                    className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Rounds & Schedule
                  </Link>
                )}

                <Link
                  href={`/admin/quizzes/${quiz.id}/live-monitor`}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  Live Monitor
                </Link>

                <Link
                  href={`/quiz/${quiz.id}`}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                  title="View Public Quiz Page"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

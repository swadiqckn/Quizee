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
  Building2,
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
          <div className="flex items-center gap-2 text-[#e05a38] text-xs font-bold uppercase tracking-wider">
            <span>Organizer Portal</span>
            <span>•</span>
            <span className="text-slate-900">{activeOrg?.name || 'All Organizations'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">Competitions Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/billing"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-[#ebdcd1] text-xs font-bold text-slate-700 shadow-sm transition"
          >
            <CreditCard className="w-4 h-4 text-[#e05a38]" />
            <span>Manage Plan</span>
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                currentPlan === 'plus'
                  ? 'bg-[#fff0ea] text-[#c2411d] border border-[#ffd8cb]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentPlan}
            </span>
          </Link>

          <Link
            href="/admin/quizzes/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create Competition
          </Link>
        </div>
      </div>

      {/* Plan Quota Alert Banner if on free plan */}
      {currentPlan === 'free' && (
        <div className="p-5 rounded-3xl bg-[#fff9f6] border-2 border-[#ffd8cb] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center text-[#e05a38] shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Free Plan: {quota.currentCount} / {quota.maxAllowed} Quizzes Created This Month
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                Free plan includes max 100 participants per competition. Upgrade to Plus for unlimited quizzes and participants.
              </p>
            </div>
          </div>

          <Link
            href="/admin/billing"
            className="px-5 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-bold transition shrink-0 shadow-md shadow-[#e05a38]/20"
          >
            Upgrade to Plus ($29/mo)
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Total Competitions</span>
            <Trophy className="w-4 h-4 text-[#e05a38]" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{orgQuizzes.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">{tournamentsCount} Tournaments, {singleCount} Single</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Total Participant Runs</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalEntries}</p>
          <p className="text-[11px] text-slate-400 font-medium">Live submissions recorded</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Participant Cap</span>
            <Users className="w-4 h-4 text-[#b45309]" />
          </div>
          <p className="text-3xl font-bold text-[#b45309]">
            {currentPlan === 'free' ? '100 / quiz' : 'Unlimited'}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">{currentPlan === 'free' ? 'Free Plan Cap' : 'Plus Plan Active'}</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Referral Invites</span>
            <Gift className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-3xl font-bold text-pink-600">{referrals.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Viral network participants</p>
        </div>
      </div>

      {/* Competitions Management Table */}
      <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Competitions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage tournament levels, questions, and live monitors</p>
          </div>
          <Link
            href="/admin/quizzes/new"
            className="text-xs font-bold text-[#e05a38] hover:underline flex items-center gap-1"
          >
            New Quiz <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {orgQuizzes.map((quiz) => (
            <div key={quiz.id} className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      quiz.quiz_type === 'tournament'
                        ? 'bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]'
                        : 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
                    }`}
                  >
                    {quiz.quiz_type}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                    {quiz.scoring_strategy === 'time_decay' ? '⚡ Time-Decay' : '🎯 Fixed'}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                    {quiz.status}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                    Max: {quiz.max_participants ? `${quiz.max_participants} users` : 'Unlimited'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{quiz.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-1">{quiz.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/quizzes/${quiz.id}/questions`}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#e05a38]" />
                  Questions ({quiz.questions_count || 0})
                </Link>

                {quiz.quiz_type === 'tournament' && (
                  <Link
                    href={`/admin/quizzes/${quiz.id}/rounds`}
                    className="px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    Rounds & Schedule
                  </Link>
                )}

                <Link
                  href={`/admin/quizzes/${quiz.id}/live-monitor`}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  Live Monitor
                </Link>

                <Link
                  href={`/quiz/${quiz.id}`}
                  className="p-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white transition shadow-sm"
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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Crown,
  ArrowLeft,
  Sparkles,
  Layers,
  Users,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { PLAN_CONFIG, PlanType } from '@/lib/types';

export default function AdminBillingPage() {
  const { activeOrg, upgradeActiveOrgPlan, currentUser } = useQuizPlatform();
  const currentPlan: PlanType = activeOrg?.plan || 'free';
  const currentQuizzesCount = activeOrg?.quizzes_created_this_month || 0;
  const [upgradedSuccess, setUpgradedSuccess] = useState(false);

  const handleSelectPlan = (plan: PlanType) => {
    upgradeActiveOrgPlan(plan);
    setUpgradedSuccess(true);
    setTimeout(() => setUpgradedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Link */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizer Dashboard
      </Link>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          Tenant Organization Plans & Quotas
        </div>
        <h1 className="text-3xl font-extrabold text-white">Subscription & Plan Limits</h1>
        <p className="text-sm text-slate-400">
          Scale your competitions with the Plus Plan for unlimited monthly quizzes and unlimited concurrent participants.
        </p>
      </div>

      {upgradedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-xl max-w-xl mx-auto">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="font-semibold">Plan updated successfully to {PLAN_CONFIG[currentPlan].name}!</p>
          </div>
        </div>
      )}

      {/* Current Usage Status Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Current Active Plan: {activeOrg?.name}
          </span>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            {currentPlan === 'plus' ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <Crown className="w-5 h-5" /> Plus Plan (Unlimited)
              </span>
            ) : (
              <span className="text-slate-200">Free Starter Plan</span>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            {currentPlan === 'free'
              ? 'Max 100 participants per quiz • Max 2 quizzes per month'
              : 'Unlimited participants • Unlimited monthly quizzes & tournaments'}
          </p>
        </div>

        {/* Monthly Quota Meter */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-w-[260px] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Quizzes Used This Month</span>
            <span className={currentPlan === 'free' && currentQuizzesCount >= 2 ? 'text-rose-400 font-bold' : 'text-white'}>
              {currentQuizzesCount} / {currentPlan === 'free' ? '2' : '∞'}
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                currentPlan === 'free' && currentQuizzesCount >= 2
                  ? 'bg-rose-500 w-full'
                  : currentPlan === 'free'
                  ? 'bg-indigo-500 w-1/2'
                  : 'bg-emerald-500 w-full'
              }`}
            ></div>
          </div>

          {currentPlan === 'free' && currentQuizzesCount >= 2 && (
            <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              Monthly limit reached. Upgrade for unlimited.
            </p>
          )}
        </div>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Plan Card */}
        <div
          className={`p-8 rounded-3xl border transition flex flex-col justify-between ${
            currentPlan === 'free'
              ? 'bg-slate-900 border-indigo-500/50 shadow-xl'
              : 'bg-slate-900/40 border-slate-800 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                Free Starter
              </span>
              {currentPlan === 'free' && (
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Current Plan
                </span>
              )}
            </div>

            <div>
              <div className="text-3xl font-black text-white">$0</div>
              <p className="text-xs text-slate-400 mt-1">Free forever for basic classroom quizzes</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Plan Highlights</p>
              <ul className="space-y-2.5 text-xs text-slate-300">
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
                  Standard Leaderboards
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleSelectPlan('free')}
              disabled={currentPlan === 'free'}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs transition"
            >
              {currentPlan === 'free' ? 'Active Plan' : 'Downgrade to Free'}
            </button>
          </div>
        </div>

        {/* Plus Plan Card */}
        <div
          className={`p-8 rounded-3xl border transition flex flex-col justify-between relative overflow-hidden ${
            currentPlan === 'plus'
              ? 'bg-slate-900 border-amber-500 shadow-2xl shadow-amber-500/10'
              : 'bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/40 shadow-xl'
          }`}
        >
          <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-l from-amber-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-bl-xl">
            Recommended
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Plus Pro
              </span>
              {currentPlan === 'plus' && (
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Current Plan
                </span>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">$29</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Unlimited power for tournaments, campuses & leagues</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Everything in Free, plus:</p>
              <ul className="space-y-2.5 text-xs text-slate-200">
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
                  Multi-level scheduled tournament progression
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Rich media diagrams, photos & audio attachments
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Viral referral bonus rewards
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Priority live contestant monitoring & CSV exports
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleSelectPlan('plus')}
              disabled={currentPlan === 'plus'}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              {currentPlan === 'plus' ? 'Active Plan' : 'Upgrade to Plus Plan ($29/mo)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

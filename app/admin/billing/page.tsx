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

  const handleSelectPlan = async (plan: PlanType) => {
    await upgradeActiveOrgPlan(plan);
    setUpgradedSuccess(true);
    setTimeout(() => setUpgradedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Link */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizer Dashboard
      </Link>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fff0ea] border border-[#ffd5c4] text-[#c2411d] text-xs font-bold uppercase tracking-wider">
          <Crown className="w-3.5 h-3.5 text-[#e05a38]" />
          Tenant Organization Plans & Quotas
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Subscription & Plan Limits</h1>
        <p className="text-sm text-slate-600">
          Scale your competitions with the Plus Plan for unlimited monthly quizzes and unlimited concurrent participants.
        </p>
      </div>

      {upgradedSuccess && (
        <div className="p-4 rounded-2xl bg-[#f0fdf4] border-2 border-[#10b981] text-[#15803d] text-xs flex items-center justify-between shadow-md max-w-xl mx-auto">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />
            <p className="font-bold">Plan updated successfully to {PLAN_CONFIG[currentPlan].name}!</p>
          </div>
        </div>
      )}

      {/* Current Usage Status Banner */}
      <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Current Active Plan: {activeOrg?.name}
          </span>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {currentPlan === 'plus' ? (
              <span className="text-[#e05a38] flex items-center gap-1.5">
                <Crown className="w-6 h-6" /> Plus Plan (Unlimited)
              </span>
            ) : (
              <span className="text-slate-800">Free Starter Plan</span>
            )}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {currentPlan === 'free'
              ? 'Max 100 participants per quiz • Max 2 quizzes per month'
              : 'Unlimited participants • Unlimited monthly quizzes & tournaments'}
          </p>
        </div>

        {/* Monthly Quota Meter */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 min-w-[260px] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Quizzes Used This Month</span>
            <span className={currentPlan === 'free' && currentQuizzesCount >= 2 ? 'text-rose-600 font-bold' : 'text-slate-900 font-bold'}>
              {currentQuizzesCount} / {currentPlan === 'free' ? '2' : '∞'}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                currentPlan === 'free' && currentQuizzesCount >= 2
                  ? 'bg-rose-500 w-full'
                  : currentPlan === 'free'
                  ? 'bg-[#e05a38] w-1/2'
                  : 'bg-[#15803d] w-full'
              }`}
            ></div>
          </div>

          {currentPlan === 'free' && currentQuizzesCount >= 2 && (
            <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
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
          className={`p-8 rounded-3xl border-2 transition flex flex-col justify-between ${
            currentPlan === 'free'
              ? 'bg-white border-slate-900 shadow-md'
              : 'bg-white/80 border-[#ebdcd1] opacity-90'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                Free Starter
              </span>
              {currentPlan === 'free' && (
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d]" /> Current Plan
                </span>
              )}
            </div>

            <div>
              <div className="text-4xl font-bold text-slate-900">$0</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Free forever for basic classroom quizzes</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Plan Highlights</p>
              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
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
                  Standard Leaderboards
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleSelectPlan('free')}
              disabled={currentPlan === 'free'}
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-900 font-bold text-xs transition"
            >
              {currentPlan === 'free' ? 'Active Plan' : 'Downgrade to Free'}
            </button>
          </div>
        </div>

        {/* Plus Plan Card */}
        <div
          className={`p-8 rounded-3xl border-2 transition flex flex-col justify-between relative overflow-hidden ${
            currentPlan === 'plus'
              ? 'bg-[#fff9f6] border-[#e05a38] shadow-2xl'
              : 'bg-[#fff9f6] border-[#ffd8cb] shadow-xl'
          }`}
        >
          <div className="absolute top-0 right-0 px-4 py-1 bg-[#e05a38] text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
            Recommended
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1.5 rounded-full bg-[#fff0ea] border border-[#ffd8cb] text-[#c2411d] text-xs font-bold flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Plus Pro
              </span>
              {currentPlan === 'plus' && (
                <span className="text-xs font-bold text-[#e05a38] flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#e05a38]" /> Current Plan
                </span>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">$29</span>
                <span className="text-xs text-slate-500 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Unlimited power for tournaments, campuses & leagues</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#ffd8cb]">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Everything in Free, plus:</p>
              <ul className="space-y-2.5 text-xs text-slate-800 font-medium">
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
                  Multi-level scheduled tournament progression
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  Rich media diagrams, photos & audio attachments
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  Viral referral bonus rewards
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
                  Priority live contestant monitoring & CSV exports
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleSelectPlan('plus')}
              disabled={currentPlan === 'plus'}
              className="w-full py-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-xl shadow-[#e05a38]/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
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

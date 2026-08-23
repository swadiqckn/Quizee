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
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  Shuffle,
  Play,
  RotateCcw,
  Gift,
  Building2,
  Crown,
  Eye,
  UserCheck,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import {
  MOCK_ORGS,
  MOCK_USERS,
  MOCK_QUIZZES,
  MOCK_ROUNDS,
  MOCK_QUESTIONS,
  MOCK_ENTRIES,
  MOCK_WINNERS,
  MOCK_REFERRALS,
} from '@/lib/mock-data';
import { calculateQuestionPoints, evaluateQualification } from '@/lib/scoring';
import { formatTimeMs, formatDate } from '@/lib/utils';
import { useQuizPlatform } from '@/lib/context';

export default function DemoPage() {
  const { currentUser, switchUserRole } = useQuizPlatform();
  const [selectedDemoQuiz, setSelectedDemoQuiz] = useState(MOCK_QUIZZES[0]);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'scoring' | 'leaderboard' | 'orgs' | 'roles'>('quizzes');

  // Interactive Scoring Simulator State
  const [simTimeTaken, setSimTimeTaken] = useState(6);
  const [simBasePoints, setSimBasePoints] = useState(10);
  const [simTimeLimit, setSimTimeLimit] = useState(15);
  const [simStrategy, setSimStrategy] = useState<'time_decay' | 'fixed'>('time_decay');

  const calculatedSimPoints = calculateQuestionPoints({
    strategy: simStrategy,
    basePoints: simBasePoints,
    timeLimitSec: simTimeLimit,
    timeTakenMs: simTimeTaken * 1000,
    isCorrect: true,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-20">
      {/* Demo Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fff0ea] border border-[#ffd5c4] text-[#c2411d] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#e05a38]" />
          Sandbox Playground & Demo Vault
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900">
          Interactive Platform Demo
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Explore sample multi-level tournaments, simulated time-decay calculations, mock contestant leaderboards, and switch between role personas in sandbox mode.
        </p>
      </div>

      {/* Demo Navigation Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
              : 'bg-white text-slate-700 hover:text-slate-950 border border-[#ebdcd1]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Demo Tournaments ({MOCK_QUIZZES.length})
        </button>

        <button
          onClick={() => setActiveTab('scoring')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'scoring'
              ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
              : 'bg-white text-slate-700 hover:text-slate-950 border border-[#ebdcd1]'
          }`}
        >
          <Zap className="w-4 h-4" />
          Time-Decay Simulator
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
              : 'bg-white text-slate-700 hover:text-slate-950 border border-[#ebdcd1]'
          }`}
        >
          <Users className="w-4 h-4" />
          Mock Leaderboards & Winners
        </button>

        <button
          onClick={() => setActiveTab('orgs')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'orgs'
              ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
              : 'bg-white text-slate-700 hover:text-slate-950 border border-[#ebdcd1]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Sample Tenant Workspaces
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
              : 'bg-white text-slate-700 hover:text-slate-950 border border-[#ebdcd1]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Demo Role Switcher
        </button>
      </div>

      {/* Tab 1: Demo Tournaments */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_QUIZZES.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => setSelectedDemoQuiz(quiz)}
                className={`p-6 rounded-3xl border-2 transition cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedDemoQuiz.id === quiz.id
                    ? 'bg-[#fff9f6] border-[#e05a38] shadow-lg'
                    : 'bg-white border-[#ebdcd1] hover:border-slate-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        quiz.quiz_type === 'tournament'
                          ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {quiz.quiz_type}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#fff0ea] text-[#c2411d]">
                      {quiz.scoring_strategy}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{quiz.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{quiz.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{quiz.base_points_per_question} pts / question</span>
                  <span className="text-[#e05a38] flex items-center gap-1">
                    Inspect Demo <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Demo Quiz Deep-Dive */}
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#e05a38] uppercase tracking-wider">
                  Tournament Structure Breakdown
                </span>
                <h2 className="text-2xl font-bold text-slate-900">{selectedDemoQuiz.title}</h2>
              </div>
              <span className="px-4 py-1.5 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a] text-xs font-bold self-start">
                Strategy: {selectedDemoQuiz.scoring_strategy}
              </span>
            </div>

            {/* Rounds Progression Flow */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Multi-Level Tournament Rounds
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MOCK_ROUNDS.filter((r) => r.quiz_id === selectedDemoQuiz.id).map((r) => (
                  <div key={r.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#e05a38]">Round {r.round_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 uppercase">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{r.title}</p>
                    <div className="text-[11px] text-slate-500 font-medium space-y-0.5 pt-1">
                      <p>• Min score to qualify: <strong className="text-slate-800">{r.min_score_to_qualify} pts</strong></p>
                      <p>• Max qualifiers: <strong className="text-slate-800">{r.max_qualifiers} contestants</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Time Decay Simulator */}
      {activeTab === 'scoring' && (
        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#e05a38]" />
              Time-Decay Points Calculator Simulator
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Test how speed and question duration dynamically award points using the formula: Points = Base × (Remaining Time / Total Time)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Scoring Strategy
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSimStrategy('time_decay')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition ${
                      simStrategy === 'time_decay'
                        ? 'bg-[#ffebe3] border-[#ffd8cb] text-[#c2411d]'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    ⚡ Time-Decay (Speed Boost)
                  </button>
                  <button
                    onClick={() => setSimStrategy('fixed')}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border transition ${
                      simStrategy === 'fixed'
                        ? 'bg-[#ffebe3] border-[#ffd8cb] text-[#c2411d]'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    🎯 Fixed Points
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Time Taken by Contestant</span>
                  <span className="text-[#e05a38] font-mono font-bold text-sm">{simTimeTaken} seconds</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={simTimeLimit}
                  step="0.5"
                  value={simTimeTaken}
                  onChange={(e) => setSimTimeTaken(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#e05a38]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>0s (Instant answer)</span>
                  <span>{simTimeLimit}s (Time expired)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Base Question Points</label>
                  <input
                    type="number"
                    value={simBasePoints}
                    onChange={(e) => setSimBasePoints(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Question Timer (Sec)</label>
                  <input
                    type="number"
                    value={simTimeLimit}
                    onChange={(e) => setSimTimeLimit(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Live Result Output */}
            <div className="p-8 rounded-3xl bg-[#fff9f6] border-2 border-[#ffd8cb] text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c2411d]">
                Calculated Points Awarded
              </span>
              <p className="text-6xl font-bold text-[#e05a38] font-mono">
                {calculatedSimPoints} <span className="text-2xl font-bold text-slate-500">/ {simBasePoints}</span>
              </p>
              <p className="text-xs text-slate-600 font-medium">
                {simStrategy === 'time_decay'
                  ? `Decayed at ${(1 - simTimeTaken / simTimeLimit) * 100}% of timer remaining.`
                  : 'Constant points awarded for correct answer regardless of speed.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Mock Leaderboards & Winners */}
      {activeTab === 'leaderboard' && (
        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Sample Contestant Leaderboard & Winner Badges
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Rankings based on time-decay scores and submission duration</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#fff0ea] text-[#c2411d] text-xs font-bold">
              {MOCK_ENTRIES.length} Mock Entries
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {MOCK_ENTRIES.map((entry, idx) => (
              <div key={entry.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{entry.user?.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {entry.total_correct} correct • {formatTimeMs(entry.total_time_taken_ms)} duration
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-[#e05a38] font-mono">{entry.score} pts</span>
                  {entry.qualified_for_next_round && (
                    <span className="px-3 py-1 rounded-xl bg-[#dcfce7] text-[#15803d] text-[10px] font-bold">
                      Qualified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Tenant Organizations */}
      {activeTab === 'orgs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_ORGS.map((org) => (
            <div key={org.id} className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center text-[#e05a38]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{org.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">slug: {org.slug}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#fff0ea] text-[#c2411d]">
                  {org.plan} Plan
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium">
                {org.plan === 'free'
                  ? 'Free Starter Plan: Max 100 participants per quiz, 2 quizzes per month.'
                  : 'Plus Pro Plan: Unlimited participants, unlimited monthly tournaments.'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Demo Personas & Role Switcher */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#e05a38]" />
                Sandbox Role Personas
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select any role persona to preview how the platform interfaces and permissions behave for different users.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Superadmin Persona */}
              <div className={`p-6 rounded-3xl border-2 transition space-y-4 flex flex-col justify-between ${
                currentUser?.role === 'superadmin' ? 'bg-[#fff9f6] border-[#e05a38] shadow-lg' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Superadmin Persona</h3>
                    <p className="text-xs text-slate-500">Platform-wide system control, organization quotas & tenant oversight.</p>
                  </div>
                </div>

                <button
                  onClick={() => switchUserRole('superadmin')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    currentUser?.role === 'superadmin'
                      ? 'bg-[#e05a38] text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                  }`}
                >
                  {currentUser?.role === 'superadmin' ? '✓ Active Role' : 'Switch to Superadmin'}
                </button>
              </div>

              {/* Admin / Organizer Persona */}
              <div className={`p-6 rounded-3xl border-2 transition space-y-4 flex flex-col justify-between ${
                currentUser?.role === 'admin' ? 'bg-[#fff9f6] border-[#e05a38] shadow-lg' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] text-[#e05a38] flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Admin (Organizer) Persona</h3>
                    <p className="text-xs text-slate-500">Create tournaments, configure time-decay rules, bulk upload questions, live arena monitor.</p>
                  </div>
                </div>

                <button
                  onClick={() => switchUserRole('admin')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    currentUser?.role === 'admin'
                      ? 'bg-[#e05a38] text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                  }`}
                >
                  {currentUser?.role === 'admin' ? '✓ Active Role' : 'Switch to Admin'}
                </button>
              </div>

              {/* Participant / Contestant Persona */}
              <div className={`p-6 rounded-3xl border-2 transition space-y-4 flex flex-col justify-between ${
                currentUser?.role === 'participant' ? 'bg-[#fff9f6] border-[#e05a38] shadow-lg' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Participant Persona</h3>
                    <p className="text-xs text-slate-500">Live arena gameplay, speed-based points, round qualification, referral invite bonuses.</p>
                  </div>
                </div>

                <button
                  onClick={() => switchUserRole('participant')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    currentUser?.role === 'participant'
                      ? 'bg-[#e05a38] text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                  }`}
                >
                  {currentUser?.role === 'participant' ? '✓ Active Role' : 'Switch to Participant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

export default function DemoPage() {
  const [selectedDemoQuiz, setSelectedDemoQuiz] = useState(MOCK_QUIZZES[0]);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'arena' | 'scoring' | 'leaderboard' | 'orgs'>('quizzes');

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
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fff0ea] border border-[#ffd5c4] text-[#c2411d] text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#e05a38]" />
          Sandbox Playground & Demo Vault
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          Interactive Platform Demo
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Explore sample multi-level tournaments, simulated time-decay calculations, mock contestant leaderboards, and tenant organization architectures in sandbox mode.
        </p>
      </div>

      {/* Demo Navigation Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
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
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
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
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
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
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'orgs'
              ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
              : 'bg-white text-slate-700 hover:text-slate-950 border border-[#ebdcd1]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Sample Tenant Workspaces
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
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        quiz.quiz_type === 'tournament'
                          ? 'bg-[#f5f3ff] text-[#7c3aed]'
                          : 'bg-[#eff6ff] text-[#2563eb]'
                      }`}
                    >
                      {quiz.quiz_type}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#fffbeb] text-[#b45309]">
                      {quiz.scoring_strategy === 'time_decay' ? '⚡ Time-Decay' : '🎯 Fixed'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900">{quiz.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{quiz.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{quiz.organisation?.name || 'Demo Tenant'}</span>
                  <span className="text-[#e05a38] font-black flex items-center gap-1">
                    Select Demo <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Demo Quiz Breakdown */}
          <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black text-[#e05a38] uppercase tracking-wider">
                  Sample Tournament Inspection
                </span>
                <h2 className="text-2xl font-black text-slate-900">{selectedDemoQuiz.title}</h2>
              </div>
              <Link
                href={`/quiz/${selectedDemoQuiz.id}`}
                className="px-6 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-black shadow-md flex items-center gap-2 shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                Launch Arena Simulation
              </Link>
            </div>

            {/* Questions in this demo */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Sample Question Bank ({MOCK_QUESTIONS.filter((q) => q.quiz_id === selectedDemoQuiz.id).length} Questions)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_QUESTIONS.filter((q) => q.quiz_id === selectedDemoQuiz.id).map((q, idx) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#e05a38]">Question #{idx + 1}</span>
                      <span className="text-xs font-bold text-slate-500">{q.points} pts • {q.time_limit_sec}s timer</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{q.question_text}</p>
                    <div className="space-y-1 pt-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center justify-between ${
                            opt.is_correct
                              ? 'bg-[#f0fdf4] text-[#15803d] font-bold border border-[#bbf7d0]'
                              : 'bg-white text-slate-600 border border-slate-100'
                          }`}
                        >
                          <span>{opt.text}</span>
                          {opt.is_correct && <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d]" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Time-Decay Scoring Simulator */}
      {activeTab === 'scoring' && (
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-8 max-w-4xl mx-auto">
          <div className="space-y-2 text-center max-w-lg mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-[#e05a38]">
              Mathematical Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Interactive Time-Decay Simulator
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Adjust response speed and observe dynamic millisecond points decrement in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4 border-t border-slate-100">
            {/* Simulator Controls */}
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Scoring Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimStrategy('time_decay')}
                    className={`py-2.5 rounded-xl text-xs font-black border transition ${
                      simStrategy === 'time_decay'
                        ? 'bg-[#fff0ea] border-[#e05a38] text-[#c2411d]'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    ⚡ Time-Decay
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimStrategy('fixed')}
                    className={`py-2.5 rounded-xl text-xs font-black border transition ${
                      simStrategy === 'fixed'
                        ? 'bg-[#fff0ea] border-[#e05a38] text-[#c2411d]'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🎯 Fixed Points
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-slate-700">
                  <span>Contestant Response Time</span>
                  <span className="text-[#e05a38] font-mono text-sm">{simTimeTaken} seconds</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={simTimeLimit}
                  step="0.5"
                  value={simTimeTaken}
                  onChange={(e) => setSimTimeTaken(Number(e.target.value))}
                  className="w-full accent-[#e05a38] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Max Base Points</label>
                  <input
                    type="number"
                    value={simBasePoints}
                    onChange={(e) => setSimBasePoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Timer Window (Sec)</label>
                  <input
                    type="number"
                    value={simTimeLimit}
                    onChange={(e) => setSimTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Live Result Output */}
            <div className="p-8 rounded-3xl bg-[#fff9f6] border-2 border-[#ffd8cb] text-center space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-[#c2411d]">
                Calculated Points Awarded
              </span>
              <p className="text-6xl font-black text-[#e05a38] font-mono">
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
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Sample Contestant Leaderboard & Winner Badges
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Rankings based on time-decay scores and submission duration</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#fff0ea] text-[#c2411d] text-xs font-black">
              {MOCK_ENTRIES.length} Mock Entries
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {MOCK_ENTRIES.map((entry, idx) => (
              <div key={entry.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      idx === 0
                        ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{entry.user?.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {entry.total_correct} correct • {formatTimeMs(entry.total_time_taken_ms)} duration
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-[#e05a38] font-mono">{entry.score} pts</span>
                  {entry.qualified_for_next_round && (
                    <span className="px-3 py-1 rounded-xl bg-[#dcfce7] text-[#15803d] text-[10px] font-black">
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
                    <h3 className="text-base font-black text-slate-900">{org.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">slug: {org.slug}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#fff0ea] text-[#c2411d]">
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
    </div>
  );
}

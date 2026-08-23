'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Layers,
  Zap,
  Clock,
  Shuffle,
  Gift,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  Shield,
  HelpCircle,
  AlertCircle,
  Crown,
  Users,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { QuizType, ProgressionMode, ScoringStrategy, PlanType, PLAN_CONFIG } from '@/lib/types';

export default function NewQuizPage() {
  const router = useRouter();
  const { createQuiz, addRound, activeOrg, canCreateQuiz, upgradeActiveOrgPlan } = useQuizPlatform();

  const quota = canCreateQuiz();
  const currentPlan: PlanType = activeOrg?.plan || 'free';

  // Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Competition & Tournament Modes
  const [quizType, setQuizType] = useState<QuizType>('tournament');
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>('automatic');

  // Scoring Strategy
  const [scoringStrategy, setScoringStrategy] = useState<ScoringStrategy>('time_decay');
  const [basePoints, setBasePoints] = useState<number>(10);
  const [timeLimitSec, setTimeLimitSec] = useState<number>(15);

  // Randomization Settings
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(false);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);

  // Referral System Settings
  const [enableReferralBonus, setEnableReferralBonus] = useState<boolean>(true);
  const [referralBonusPoints, setReferralBonusPoints] = useState<number>(25);

  // Multi-round tournament initial rounds (if tournament)
  const [round1Title, setRound1Title] = useState('Round 1: Prelims');
  const [round1Start, setRound1Start] = useState(new Date().toISOString().slice(0, 16));
  const [round1MinScore, setRound1MinScore] = useState<number>(8);
  const [round1MinCorrect, setRound1MinCorrect] = useState<number>(1);

  const [round2Title, setRound2Title] = useState('Round 2: Grand Finals');
  const [round2Start, setRound2Start] = useState(
    new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );
  const [round2MinScore, setRound2MinScore] = useState<number>(15);
  const [round2MinCorrect, setRound2MinCorrect] = useState<number>(2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createQuiz({
      title: title.trim(),
      description: description.trim(),
      banner_url: bannerUrl.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
      quiz_type: quizType,
      progression_mode: progressionMode,
      scoring_strategy: scoringStrategy,
      base_points_per_question: Number(basePoints),
      time_limit_per_question_sec: Number(timeLimitSec),
      shuffle_questions: shuffleQuestions,
      shuffle_options: shuffleOptions,
      enable_referral_bonus: enableReferralBonus,
      referral_bonus_points: Number(referralBonusPoints),
      status: 'published',
    });

    if (!res.success) {
      setIsSubmitting(false);
      setErrorMessage(res.error || 'Failed to create quiz due to plan limits.');
      return;
    }

    const created = res.quiz!;

    // If tournament, create initial rounds
    if (quizType === 'tournament') {
      await addRound(created.id, {
        round_number: 1,
        title: round1Title,
        scheduled_start_time: new Date(round1Start).toISOString(),
        scheduled_end_time: new Date(new Date(round1Start).getTime() + 24 * 3600000).toISOString(),
        min_score_to_qualify: Number(round1MinScore),
        min_correct_to_qualify: Number(round1MinCorrect),
        status: 'active',
      });

      await addRound(created.id, {
        round_number: 2,
        title: round2Title,
        scheduled_start_time: new Date(round2Start).toISOString(),
        scheduled_end_time: new Date(new Date(round2Start).getTime() + 24 * 3600000).toISOString(),
        min_score_to_qualify: Number(round2MinScore),
        min_correct_to_qualify: Number(round2MinCorrect),
        status: 'pending',
      });
    }

    setTimeout(() => {
      router.push(`/admin/quizzes/${created.id}/questions`);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back link */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Create New Competition</h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure single competitions or multi-level tournaments with automated scheduling & dynamic scoring.
          </p>
        </div>

        {/* Plan Pill */}
        <div className="p-3 rounded-2xl bg-white border border-[#ebdcd1] text-xs shadow-sm">
          <p className="text-slate-500 font-medium">Current Plan: <strong className="text-slate-900 uppercase font-bold">{currentPlan}</strong></p>
          <p className="text-[11px] text-slate-400 font-bold">
            {currentPlan === 'free' ? 'Max 100 participants • 2 quizzes/mo' : 'Unlimited'}
          </p>
        </div>
      </div>

      {/* Plan Limit Exceeded Alert */}
      {!quota.allowed && (
        <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-200 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-rose-900">Monthly Quiz Limit Reached (Free Plan)</h3>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed font-medium">
                The Free Starter Plan allows a maximum of <strong>2 quizzes per month</strong>. You have already created 2 quizzes this month.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                upgradeActiveOrgPlan('plus');
                setErrorMessage(null);
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Plus Plan ($29/mo)
            </button>
            <Link
              href="/admin/billing"
              className="text-xs text-slate-700 font-bold hover:underline px-3 py-2"
            >
              View Plan Comparisons
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#e05a38]" />
            1. Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Competition Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. AI & Web3 National Championship 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Description</label>
              <textarea
                rows={3}
                placeholder="Describe rules, eligibility, prizes, or topic coverage..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Cover Banner Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Competition Format & Tournament Progression */}
        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            2. Competition Format & Progression
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setQuizType('tournament')}
              className={`p-6 rounded-2xl border-2 text-left transition ${
                quizType === 'tournament'
                  ? 'bg-[#f5f3ff] border-[#8b5cf6] text-slate-900 shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#faf5ff]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Layers className="w-5 h-5 text-purple-600" />
                {quizType === 'tournament' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
              </div>
              <h3 className="font-bold text-sm text-slate-900">Multi-Round Tournament</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Multi-level tournament (e.g. Prelims $\to$ Finals) with qualification criteria.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setQuizType('single')}
              className={`p-6 rounded-2xl border-2 text-left transition ${
                quizType === 'single'
                  ? 'bg-[#eff6ff] border-[#3b82f6] text-slate-900 shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#eff6ff]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                {quizType === 'single' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
              <h3 className="font-bold text-sm text-slate-900">Single Competition</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Standalone single-round quiz challenge with instant final leaderboard.
              </p>
            </button>
          </div>

          {/* If Tournament: Progression Mode & Initial Rounds */}
          {quizType === 'tournament' && (
            <div className="pt-4 border-t border-slate-100 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Tournament Progression Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProgressionMode('automatic')}
                    className={`p-4 rounded-2xl border-2 text-left text-xs transition ${
                      progressionMode === 'automatic'
                        ? 'bg-[#fff0ea] border-[#e05a38] text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <p className="font-bold text-slate-900 mb-1">🕒 Automatic Progression (Scheduled)</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Rounds automatically unlock at set date/time for qualified contestants.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProgressionMode('manual')}
                    className={`p-4 rounded-2xl border-2 text-left text-xs transition ${
                      progressionMode === 'manual'
                        ? 'bg-[#fff0ea] border-[#e05a38] text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <p className="font-bold text-slate-900 mb-1">🛡️ Manual Progression (Organizer Controlled)</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Organizer manually reviews and triggers next level qualification.
                    </p>
                  </button>
                </div>
              </div>

              {/* Initial Round Setup */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Initial Tournament Rounds & Qualification Criteria
                </h3>

                {/* Round 1 */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e05a38]">Level 1 (Prelims / Qualifier)</span>
                    <span className="text-[11px] text-[#15803d] font-bold">Active upon publish</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Round Title</label>
                      <input
                        type="text"
                        value={round1Title}
                        onChange={(e) => setRound1Title(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Min Score to Qualify</label>
                      <input
                        type="number"
                        value={round1MinScore}
                        onChange={(e) => setRound1MinScore(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Min Correct Answers</label>
                      <input
                        type="number"
                        value={round1MinCorrect}
                        onChange={(e) => setRound1MinCorrect(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Round 2 */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700">Level 2 (Grand Finals)</span>
                    <span className="text-[11px] text-[#b45309] font-bold">Unlocks automatically</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Round Title</label>
                      <input
                        type="text"
                        value={round2Title}
                        onChange={(e) => setRound2Title(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Scheduled Start</label>
                      <input
                        type="datetime-local"
                        value={round2Start}
                        onChange={(e) => setRound2Start(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Min Score</label>
                      <input
                        type="number"
                        value={round2MinScore}
                        onChange={(e) => setRound2MinScore(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Min Correct</label>
                      <input
                        type="number"
                        value={round2MinCorrect}
                        onChange={(e) => setRound2MinCorrect(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Pointing & Scoring Criteria */}
        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            3. Pointing & Scoring Engine
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setScoringStrategy('time_decay')}
              className={`p-6 rounded-2xl border-2 text-left transition ${
                scoringStrategy === 'time_decay'
                  ? 'bg-[#fffbeb] border-[#f59e0b] text-slate-900 shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#fffbeb]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-amber-500" />
                {scoringStrategy === 'time_decay' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
              </div>
              <h3 className="font-bold text-sm text-slate-900">Time-Decay Dynamic Scoring</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Max points decrement continuously as question timer ticks down.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScoringStrategy('fixed')}
              className={`p-6 rounded-2xl border-2 text-left transition ${
                scoringStrategy === 'fixed'
                  ? 'bg-[#fff0ea] border-[#e05a38] text-slate-900 shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#fff0ea]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-[#e05a38]" />
                {scoringStrategy === 'fixed' && <CheckCircle2 className="w-4 h-4 text-[#e05a38]" />}
              </div>
              <h3 className="font-bold text-sm text-slate-900">Fixed Pointing</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Constant points awarded for correct answers regardless of response speed.
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Max / Base Points per Question
              </label>
              <input
                type="number"
                value={basePoints}
                onChange={(e) => setBasePoints(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Question Time Limit (seconds)
              </label>
              <input
                type="number"
                value={timeLimitSec}
                onChange={(e) => setTimeLimitSec(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Randomization & Referral System */}
        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-pink-500" />
            4. Randomization & Referral Incentives
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shuffling */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Anti-Cheat Randomization</h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-4 h-4 rounded text-[#e05a38] border-slate-300 focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-800">Shuffle MCQ Options (Default: On)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-4 h-4 rounded text-[#e05a38] border-slate-300 focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-800">Shuffle Question Order per participant</span>
              </label>
            </div>

            {/* Referral Settings */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Referral Rewards</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableReferralBonus}
                  onChange={(e) => setEnableReferralBonus(e.target.checked)}
                  className="w-4 h-4 rounded text-[#e05a38] border-slate-300 focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-800">Award referral bonus points for invites</span>
              </label>

              {enableReferralBonus && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Referral Bonus Points</label>
                  <input
                    type="number"
                    value={referralBonusPoints}
                    onChange={(e) => setReferralBonusPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/dashboard"
            className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !quota.allowed}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-[#e05a38]/20 transition hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? 'Creating Competition...' : 'Create & Proceed to Questions'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

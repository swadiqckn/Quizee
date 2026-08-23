'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Eye,
  Trash2,
  Save,
  Globe,
  Settings,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { QuizType, ProgressionMode, ScoringStrategy } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const { quizzes, updateQuiz, deleteQuiz, isLoading } = useQuizPlatform();
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  const quiz = quizzes.find((q) => q.id === quizId) || directQuiz;

  // Basic Information
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'completed' | 'archived'>('published');

  // Competition & Tournament Modes
  const [quizType, setQuizType] = useState<QuizType>('tournament');
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>('automatic');

  // Scoring Strategy
  const [scoringStrategy, setScoringStrategy] = useState<ScoringStrategy>('time_decay');
  const [basePoints, setBasePoints] = useState<number>(10);
  const [timeLimitSec, setTimeLimitSec] = useState<number>(15);

  // Randomization & Retry Settings
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(false);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [allowRetries, setAllowRetries] = useState<boolean>(false);

  // Referral System Settings
  const [enableReferralBonus, setEnableReferralBonus] = useState<boolean>(true);
  const [referralBonusPoints, setReferralBonusPoints] = useState<number>(25);
  const [isPublic, setIsPublic] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pre-fill form values when quiz loads
  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title || '');
      setSlug(quiz.slug || '');
      setDescription(quiz.description || '');
      setBannerUrl(quiz.banner_url || '');
      setStatus(quiz.status || 'published');
      setIsPublic(quiz.is_public !== false);
      setQuizType(quiz.quiz_type || 'tournament');
      setProgressionMode(quiz.progression_mode || 'automatic');
      setScoringStrategy(quiz.scoring_strategy || 'time_decay');
      setBasePoints(quiz.base_points_per_question ?? 10);
      setTimeLimitSec(quiz.time_limit_per_question_sec ?? 15);
      setShuffleQuestions(quiz.shuffle_questions ?? false);
      setShuffleOptions(quiz.shuffle_options ?? true);
      setAllowRetries(quiz.allow_retries ?? false);
      setEnableReferralBonus(quiz.enable_referral_bonus ?? true);
      setReferralBonusPoints(quiz.referral_bonus_points ?? 25);
    }
  }, [quiz]);

  useEffect(() => {
    if (!quiz && quizId) {
      setIsFetchingDirect(true);
      const supabase = createClient();
      const fetchDirect = async () => {
        try {
          const { data } = await supabase
            .from('quizzes')
            .select('*, organisation:organisations(*)')
            .eq('id', quizId)
            .single();
          if (data) setDirectQuiz(data);
        } catch (err) {
        } finally {
          setIsFetchingDirect(false);
        }
      };
      fetchDirect();
    }
  }, [quiz, quizId]);

  if (isLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Loading Competition Settings...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Competition Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">The quiz you are trying to edit does not exist or has been removed.</p>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-bold transition shadow-sm mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizer Dashboard
        </Link>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await updateQuiz(quizId, {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        banner_url: bannerUrl.trim() || undefined,
        status,
        is_public: isPublic,
        quiz_type: quizType,
        progression_mode: progressionMode,
        scoring_strategy: scoringStrategy,
        base_points_per_question: Number(basePoints),
        time_limit_per_question_sec: Number(timeLimitSec),
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        allow_retries: allowRetries,
        enable_referral_bonus: enableReferralBonus,
        referral_bonus_points: Number(referralBonusPoints),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update competition settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteQuiz(quizId);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete competition.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizer Dashboard
        </Link>

        {/* Quick Tabs to other Quiz Subpages */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <Link
            href={`/admin/quizzes/${quizId}/questions`}
            className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#e05a38]" />
            Questions ({quiz.questions_count || 0})
          </Link>

          {quiz.quiz_type === 'tournament' && (
            <Link
              href={`/admin/quizzes/${quizId}/rounds`}
              className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Rounds & Schedule
            </Link>
          )}

          <Link
            href={`/admin/quizzes/${quizId}/live-monitor`}
            className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Eye className="w-3.5 h-3.5 text-amber-600" />
            Live Monitor
          </Link>

          <Link
            href={`/${quiz.slug || quizId}`}
            className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-sm shrink-0"
            target="_blank"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            Public Page
          </Link>
        </div>
      </div>

      {/* Main Form Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fff0ea] border border-[#ffd5c4] text-[#c2411d] text-xs font-bold uppercase tracking-wider">
          <Settings className="w-3.5 h-3.5 text-[#e05a38]" />
          Edit Competition
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Edit Quiz Settings</h1>
        <p className="text-slate-600 text-xs font-medium">
          Update branding, dedicated slug URL, scoring engine, retry policies, and viral incentives.
        </p>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✓ Competition settings updated successfully!</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-8">
        {/* Card 1: Core Details & Slug */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#e05a38]" />
            Core Competition Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Competition Title <span className="text-[#e05a38]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ziyara 2026 Quiz"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            {/* Dedicated Short Slug */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dedicated Quiz Short Slug URL
              </label>
              <div className="flex items-center rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden focus-within:border-[#e05a38]">
                <span className="px-3 py-3 bg-slate-100 border-r border-slate-200 text-xs text-slate-500 font-mono">
                  domain.com/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="ziyara26"
                  className="flex-1 px-3 py-3 bg-transparent text-xs font-mono text-slate-900 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Allows contestants to join directly at <code>https://quizee-beta.vercel.app/{slug || 'your-slug'}</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description / Instructions</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what contestants will be tested on and any grand prizes..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cover Banner Image URL</label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Publishing Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#e05a38]"
              >
                <option value="published">🟢 Published (Live & Accessible)</option>
                <option value="draft">🟡 Draft (Hidden from participants)</option>
                <option value="completed">🔵 Completed (Archived results)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Visibility & Directory Listing</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    isPublic
                      ? 'bg-emerald-50 border-emerald-600 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      🌐 Public Competition
                    </span>
                    {isPublic && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Listed on the public Explore directory for anyone to discover.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    !isPublic
                      ? 'bg-amber-50 border-amber-600 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      🔒 Private (Direct Link Only)
                    </span>
                    {!isPublic && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Hidden from Explore. Only users with the direct link/slug can enter.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Competition Format & Progression */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            Competition Format
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setQuizType('tournament')}
              className={`p-4 rounded-2xl border text-left transition space-y-1.5 ${
                quizType === 'tournament'
                  ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">Multi-Level Tournament</span>
                {quizType === 'tournament' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Multiple progressive rounds (e.g. Prelims $\to$ Finals) with custom qualifying cut-offs.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setQuizType('single')}
              className={`p-4 rounded-2xl border text-left transition space-y-1.5 ${
                quizType === 'single'
                  ? 'border-[#e05a38] bg-[#fff0ea]/50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Single Rapid Assessment</span>
                {quizType === 'single' && <CheckCircle2 className="w-4 h-4 text-[#e05a38]" />}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Single-session assessment with instant leaderboard placement and scoring.
              </p>
            </button>
          </div>
        </div>

        {/* Card 3: Scoring Engine, Timer & Anti-Cheat */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Scoring Engine, Timer & Anti-Cheat
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setScoringStrategy('time_decay')}
              className={`p-4 rounded-2xl border text-left transition space-y-1.5 ${
                scoringStrategy === 'time_decay'
                  ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">⚡ Dynamic Speed Decay</span>
                {scoringStrategy === 'time_decay' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Points awarded decay smoothly based on contestant response speed to break leaderboard ties.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScoringStrategy('fixed')}
              className={`p-4 rounded-2xl border text-left transition space-y-1.5 ${
                scoringStrategy === 'fixed'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">🎯 Fixed Points per Question</span>
                {scoringStrategy === 'fixed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Standard flat score awarded for each correct answer regardless of speed.
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base Points per Question</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={basePoints}
                onChange={(e) => setBasePoints(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Limit per Question (seconds)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={timeLimitSec}
                onChange={(e) => setTimeLimitSec(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#e05a38]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#e05a38] rounded"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Shuffle Answer Choices</p>
                <p className="text-[11px] text-slate-500 font-medium">Randomizes MCQ option order per contestant.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#e05a38] rounded"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Shuffle Question Order</p>
                <p className="text-[11px] text-slate-500 font-medium">Randomizes order of questions served in the arena.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Card 4: Retries & Referral Policies */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            Contestant Policies & Viral Incentives
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Try Again Policy Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Contestant Retries Policy</p>
                  <p className="text-[11px] text-slate-500 font-medium">Allow contestants to retry the quiz after finishing.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowRetries(!allowRetries)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    allowRetries ? 'bg-[#e05a38]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      allowRetries ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                  allowRetries ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {allowRetries ? '✓ Retries Allowed' : '🛑 Single Attempt Only (No retries)'}
              </span>
            </div>

            {/* Referral Bonus Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Viral Referral Bonus</p>
                  <p className="text-[11px] text-slate-500 font-medium">Award extra points for inviting friends.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableReferralBonus(!enableReferralBonus)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    enableReferralBonus ? 'bg-[#e05a38]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      enableReferralBonus ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

              {enableReferralBonus && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bonus Points per Invite</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={referralBonusPoints}
                    onChange={(e) => setReferralBonusPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#e05a38]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Competition</span>
          </button>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition text-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-bold shadow-xl shadow-[#e05a38]/25 transition hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Competition Changes'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Delete Competition?</h3>
              <p className="text-xs text-slate-600 font-medium">
                Are you sure you want to delete <strong className="text-slate-900">{quiz.title}</strong>? This action cannot be undone and will remove all questions, rounds, and participant entry records.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

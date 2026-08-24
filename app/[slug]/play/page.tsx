'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Maximize2,
  ChevronRight,
  Trophy,
  LogIn,
  Shield,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { shuffleArray } from '@/lib/scoring';
import { Question, QuestionOption } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { matchQuizBySlugOrId } from '@/lib/slug';
import { formatDate } from '@/lib/utils';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import {
  AntiCheatWarningModal,
  AntiCheatStatusBadge,
  AntiCheatFullscreenGate,
} from '@/components/quiz/AntiCheatWarningModal';

function SlugQuizPlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params.slug as string;
  const roundId = searchParams.get('roundId');

  const { quizzes, rounds, questions, entries, submitQuizAttempt, currentUser, loginWithGoogle, isLoading } = useQuizPlatform();
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  const quiz = matchQuizBySlugOrId(quizzes, slug) || directQuiz;
  const currentRound = roundId ? rounds.find((r) => r.id === roundId) : null;

  React.useEffect(() => {
    if (!quiz && slug) {
      setIsFetchingDirect(true);
      const supabase = createClient();
      const fetchDirect = async () => {
        try {
          const { data: byId } = await supabase
            .from('quizzes')
            .select('*, organisation:organisations(*)')
            .eq('id', slug)
            .single();

          if (byId) {
            setDirectQuiz(byId);
            return;
          }

          const { data: allQ } = await supabase
            .from('quizzes')
            .select('*, organisation:organisations(*)');

          if (allQ) {
            const matched = matchQuizBySlugOrId(allQ, slug);
            if (matched) setDirectQuiz(matched);
          }
        } catch (err) {
        } finally {
          setIsFetchingDirect(false);
        }
      };
      fetchDirect();
    }
  }, [quiz, slug]);

  // Filter questions for this quiz / round
  const rawQuestions = questions.filter((q) => {
    if (!quiz) return false;
    if (roundId) return q.quiz_id === quiz.id && q.round_id === roundId;
    return q.quiz_id === quiz.id;
  });

  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string[] }>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number>(15);
  const [currentPointsPotential, setCurrentPointsPotential] = useState<number>(10);
  const [answersLog, setAnswersLog] = useState<
    Array<{ questionId: string; selectedOptionIds: string[]; timeTakenMs: number }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Initialize and shuffle questions & options
  useEffect(() => {
    if (rawQuestions.length === 0) return;

    let qList = [...rawQuestions];
    if (quiz?.shuffle_questions) {
      qList = shuffleArray(qList);
    }

    if (quiz?.shuffle_options) {
      qList = qList.map((q) => ({
        ...q,
        options: shuffleArray(q.options),
      }));
    }

    setActiveQuestions(qList);
    setCurrentIndex(0);
    setQuestionStartTime(Date.now());
  }, [quiz?.id, roundId, rawQuestions.length]);

  const currentQ = activeQuestions[currentIndex];
  const rawQTime = currentQ?.time_limit_sec !== undefined ? currentQ.time_limit_sec : quiz?.time_limit_per_question_sec;
  const hasTimeLimit = rawQTime !== undefined && rawQTime !== null && rawQTime > 0;
  const maxQTime = hasTimeLimit ? rawQTime : 0;
  const baseQPts = currentQ?.points || quiz?.base_points_per_question || 10;

  // Real-Time Countdown & Point Decay Engine
  useEffect(() => {
    if (!currentQ || isSubmitting) return;

    setQuestionStartTime(Date.now());

    if (!hasTimeLimit) {
      setTimeRemaining(0);
      setCurrentPointsPotential(baseQPts);
      return;
    }

    setTimeRemaining(maxQTime);
    setCurrentPointsPotential(baseQPts);

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - questionStartTime;
      const elapsedSec = elapsedMs / 1000;
      const remaining = Math.max(0, maxQTime - elapsedSec);
      setTimeRemaining(remaining);

      if (quiz?.scoring_strategy === 'time_decay') {
        const decayFraction = Math.max(0, remaining / maxQTime);
        const pts = Math.max(1, Math.round(baseQPts * decayFraction));
        setCurrentPointsPotential(pts);
      } else {
        setCurrentPointsPotential(baseQPts);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        handleNextQuestion(true); // Auto submit on timer expiry
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, currentQ?.id, maxQTime, baseQPts, isSubmitting, hasTimeLimit]);

  const handleSelectOption = (optionId: string) => {
    if (!currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: [optionId],
    }));
  };

  const handleNextQuestion = async (isAutoExpire = false) => {
    if (!currentQ || isSubmitting || !quiz) return;

    const timeTakenMs = hasTimeLimit ? Math.min(maxQTime * 1000, Date.now() - questionStartTime) : Date.now() - questionStartTime;
    const chosenOptions = selectedAnswers[currentQ.id] || [];

    const newLogItem = {
      questionId: currentQ.id,
      selectedOptionIds: chosenOptions,
      timeTakenMs: isAutoExpire ? maxQTime * 1000 : timeTakenMs,
    };

    const nextAnswersLog = [...answersLog, newLogItem];
    setAnswersLog(nextAnswersLog);

    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await handleCompleteAttempt(nextAnswersLog);
    }
  };

  const handleCompleteAttempt = async (
    finalAnswersLog: Array<{ questionId: string; selectedOptionIds: string[]; timeTakenMs: number }>,
    status: 'submitted' | 'flagged_for_cheating' = 'submitted',
    violationsCount: number = antiCheat.violationCount
  ) => {
    if (!quiz || isSubmitting) return;
    setIsSubmitting(true);
    const result = await submitQuizAttempt({
      quizId: quiz.id,
      roundId: roundId || null,
      answers: finalAnswersLog,
      status,
      violationsCount,
    });

    setTimeout(() => {
      router.push(`/${slug}/results?entryId=${result.entry.id}`);
    }, 800);
  };

  const antiCheat = useAntiCheat({
    enabled: quiz?.anti_cheat_enabled === true,
    maxViolations: quiz?.max_violations || 3,
    isActive: Boolean(quiz && currentUser && !isSubmitting && activeQuestions.length > 0),
    onMaxViolationsReached: (violationsCount) => {
      // Auto submit immediately on max violations
      handleCompleteAttempt(answersLog, 'flagged_for_cheating', violationsCount);
    },
  });

  if (isLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Connecting to Live Arena...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Competition Arena Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">The competition link may be invalid or expired.</p>
        <Link href="/explore" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] text-white text-xs font-bold hover:bg-[#c84a29] transition shadow-sm mt-2">
          Back to Explore
        </Link>
      </div>
    );
  }

  // Check if participant already completed this quiz and retries are disallowed
  const existingCompletedEntry = entries.find(
    (e) =>
      e.quiz_id === quiz.id &&
      (currentUser ? e.user_id === currentUser.id : false) &&
      (e.status === 'submitted' || e.status === 'flagged_for_cheating')
  );

  const disallowRetries = quiz.allow_retries !== true;

  if (currentUser && existingCompletedEntry && disallowRetries) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-[#ebdcd1] shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
              Single Attempt Only
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Attempt Already Completed</h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              You have already completed <strong className="text-slate-900">{quiz.title}</strong>. This competition does not allow multiple attempts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-slate-500 font-bold">Your Score</p>
              <p className="text-xl font-bold text-[#e05a38]">{existingCompletedEntry.score} pts</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold">Correct</p>
              <p className="text-xl font-bold text-[#15803d]">{existingCompletedEntry.total_correct} correct</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href={`/${slug}/results?entryId=${existingCompletedEntry.id}`}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>View Results & Answers</span>
            </Link>

            <Link
              href={`/${slug}`}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <span>Back to Overview</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if competition start time has not arrived yet
  const scheduledStartTimeStr = currentRound?.scheduled_start_time || quiz.start_time;
  const isScheduledInFuture = scheduledStartTimeStr ? new Date(scheduledStartTimeStr).getTime() > Date.now() : false;

  if (isScheduledInFuture) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-[#ebdcd1] shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
              Starts Soon
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Competition Has Not Started</h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This competition is scheduled to begin at <strong className="text-slate-900">{formatDate(scheduledStartTimeStr)}</strong>.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/${slug}`}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition flex items-center justify-center gap-2"
            >
              <span>Back to Overview & Countdown</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Google Login Gate for Participants who start without being logged in
  if (!currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center mx-auto text-[#e05a38]">
            <Trophy className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Join Competition Arena</h1>
            <p className="text-xs text-slate-500">
              Sign in with Google to record your live score and tournament rankings for{' '}
              <strong className="text-slate-900">{quiz.title}</strong>.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  loginWithGoogle({
                    role: 'participant',
                    returnUrl: window.location.pathname + window.location.search,
                  });
                }
              }}
              type="button"
              className="w-full py-4 px-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-xl shadow-[#e05a38]/25 transition flex items-center justify-center gap-3 hover:scale-[1.02]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#ffffff"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#ffffff"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#ffffff"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google & Start</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href={`/login?returnUrl=${encodeURIComponent(`/${slug}/play${roundId ? `?roundId=${roundId}` : ''}`)}`}
              className="text-xs text-slate-500 font-bold hover:text-slate-900 transition flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in with Username & Password
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (activeQuestions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <Clock className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Questions Configured</h2>
        <p className="text-xs text-slate-500">The organizer has not yet populated questions for this competition round.</p>
        <Link href={`/${slug}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold transition">
          Back to Overview
        </Link>
      </div>
    );
  }

  if (!currentQ) return null;

  const currentSelection = selectedAnswers[currentQ.id] || [];
  const timerPercentage = (timeRemaining / maxQTime) * 100;

  return (
    <div
      {...antiCheat.containerProps}
      className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 ${antiCheat.containerProps.className}`}
    >
      {/* Top Arena HUD Bar */}
      <div className="p-4 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm flex items-center justify-between gap-4">
        {/* Left: Round & Question Progress */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center font-bold text-[#e05a38] text-sm">
            {currentIndex + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-900">
                Question {currentIndex + 1} <span className="text-slate-400">/ {activeQuestions.length}</span>
              </p>
              <AntiCheatStatusBadge
                enabled={quiz.anti_cheat_enabled}
                violationCount={antiCheat.violationCount}
                maxViolations={antiCheat.maxViolations}
                isFullscreen={antiCheat.isFullscreen}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {currentRound ? currentRound.title : quiz.title}
            </p>
          </div>
        </div>

        {/* Center: Live Dynamic Points Potential */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#fff9f6] border border-[#ffd8cb]">
          <Zap className="w-4 h-4 text-[#e05a38] animate-pulse" />
          <span className="text-xs font-bold text-slate-700">Worth:</span>
          <span className="text-sm font-bold text-[#e05a38] font-mono">+{currentPointsPotential} pts</span>
        </div>

        {/* Right: Real-time Countdown Timer or Unlimited Badge */}
        <div className="flex items-center gap-2.5">
          <Clock className={`w-5 h-5 ${hasTimeLimit && timeRemaining <= 5 ? 'text-rose-500 animate-bounce' : 'text-[#e05a38]'}`} />
          {hasTimeLimit ? (
            <span
              className={`text-lg font-bold font-mono ${
                timeRemaining <= 5 ? 'text-rose-600 font-bold' : 'text-slate-900'
              }`}
            >
              {timeRemaining.toFixed(1)}s
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded-xl">
              ∞ Unlimited Time
            </span>
          )}
        </div>
      </div>

      {/* Timer Progress Bar (Only when time limit is active) */}
      {hasTimeLimit && (
        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              timeRemaining <= 5 ? 'bg-rose-500' : 'bg-[#e05a38]'
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      )}

      {/* Question Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
        {/* Question Text */}
        <div className="space-y-3 select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#e05a38] uppercase tracking-wider">Single Choice</span>
            <span className="text-xs text-slate-400 font-bold">Base: {currentQ.points} pts</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug select-none">
            {currentQ.question_text}
          </h2>
        </div>

        {/* Attachment Media if present */}
        {currentQ.attachment_url && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-72 bg-slate-50 flex items-center justify-center relative group select-none pointer-events-none">
            <img
              src={currentQ.attachment_url}
              alt="Question media"
              className="max-h-72 object-contain w-full select-none pointer-events-none"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}

        {/* MCQ Options Grid */}
        <div className="grid grid-cols-1 gap-3 pt-2 select-none">
          {currentQ.options.map((option, idx) => {
            const isSelected = currentSelection.includes(option.id);
            const letter = String.fromCharCode(65 + idx);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center justify-between gap-4 select-none ${
                  isSelected
                    ? 'bg-[#fff0ea] border-[#e05a38] text-slate-950 shadow-md shadow-[#e05a38]/10'
                    : 'bg-white border-[#ebdcd1] hover:border-slate-400 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                      isSelected
                        ? 'bg-[#e05a38] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm font-bold leading-relaxed select-none">{option.text}</span>
                </div>

                {isSelected && <CheckCircle2 className="w-5 h-5 text-[#e05a38] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Submit / Next Action Bar */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-400 font-bold">
            {currentIndex + 1 === activeQuestions.length ? 'Final Question' : 'Speed earns maximum points'}
          </span>

          <button
            type="button"
            onClick={() => handleNextQuestion(false)}
            disabled={isSubmitting || currentSelection.length === 0}
            className="px-8 py-3.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] disabled:opacity-40 disabled:hover:bg-[#e05a38] text-white font-bold text-xs shadow-xl shadow-[#e05a38]/25 transition flex items-center gap-2"
          >
            <span>
              {isSubmitting
                ? 'Recording Submission...'
                : currentIndex + 1 === activeQuestions.length
                ? 'Finish Attempt'
                : 'Next Question'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fullscreen Gate when anti-cheat enabled & not fullscreen yet */}
      {quiz.anti_cheat_enabled && !antiCheat.isFullscreen && !antiCheat.isFlagged && (
        <AntiCheatFullscreenGate
          quizTitle={quiz.title}
          maxViolations={quiz.max_violations || 3}
          onEnterFullscreen={async () => {
            await antiCheat.enterFullscreen();
            setQuestionStartTime(Date.now());
          }}
        />
      )}

      {/* Anti-Cheat Warning Modal */}
      <AntiCheatWarningModal
        isOpen={antiCheat.isWarningModalOpen}
        violation={antiCheat.lastViolation}
        violationCount={antiCheat.violationCount}
        maxViolations={antiCheat.maxViolations}
        isFlagged={antiCheat.isFlagged}
        isFullscreen={antiCheat.isFullscreen}
        onReEnterFullscreen={async () => {
          await antiCheat.enterFullscreen();
          setQuestionStartTime(Date.now());
        }}
        onDismiss={antiCheat.dismissWarning}
      />
    </div>
  );
}

export default function SlugQuizPlayPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto py-20 text-center text-slate-400 text-xs">Loading Arena...</div>}>
      <SlugQuizPlayContent />
    </Suspense>
  );
}

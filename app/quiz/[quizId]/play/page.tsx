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
import { formatDate } from '@/lib/utils';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import {
  AntiCheatWarningModal,
  AntiCheatStatusBadge,
  AntiCheatFullscreenGate,
} from '@/components/quiz/AntiCheatWarningModal';
import {
  getOrCreateSessionNonce,
  generateAnswerIntegrityHash,
  saveLocalAttemptProgress,
  clearLocalAttemptProgress,
} from '@/lib/tamperProof';

function QuizPlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const quizId = params.quizId as string;
  const roundId = searchParams.get('roundId');

  const { quizzes, rounds, questions, entries, submitQuizAttempt, currentUser, loginWithGoogle, isLoading } = useQuizPlatform();
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  const quiz = quizzes.find((q) => q.id === quizId) || directQuiz;
  const currentRound = roundId ? rounds.find((r) => r.id === roundId) : null;

  React.useEffect(() => {
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

  // Filter questions for this quiz / round
  const rawQuestions = questions.filter((q) => {
    if (roundId) return q.quiz_id === quizId && q.round_id === roundId;
    return q.quiz_id === quizId;
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
  }, [quizId, roundId]);

  const currentQuestion = activeQuestions[currentIndex];
  // If the quiz itself has time_limit_per_question_sec = 0 (or null), the entire quiz has unlimited time per question
  const isQuizUnlimited = quiz?.time_limit_per_question_sec === 0 || quiz?.time_limit_per_question_sec === null;
  const rawQTime = isQuizUnlimited
    ? 0
    : (currentQuestion?.time_limit_sec !== undefined && currentQuestion?.time_limit_sec !== null
        ? currentQuestion.time_limit_sec
        : (quiz?.time_limit_per_question_sec ?? 0));

  const hasTimeLimit = Boolean(rawQTime && rawQTime > 0);
  const questionLimitSec = hasTimeLimit ? rawQTime : 0;
  const basePoints = currentQuestion?.points || quiz?.base_points_per_question || 10;
  const decayStartSource = currentRound?.decay_start_source || quiz?.decay_start_source || 'question_open';
  const decayMinPoints = currentRound?.decay_min_points ?? quiz?.decay_min_points ?? 1;

  // Session Nonce for cryptographic tamper protection
  const sessionNonce = React.useMemo(() => {
    return getOrCreateSessionNonce(quizId, currentUser?.id || 'anon');
  }, [quizId, currentUser?.id]);

  // Reset timer on question change
  useEffect(() => {
    if (!currentQuestion || !currentUser) return;
    setQuestionStartTime(Date.now());
    if (!hasTimeLimit) {
      setTimeRemaining(0);
      setCurrentPointsPotential(basePoints);
      return;
    }
    setTimeRemaining(questionLimitSec);
    setCurrentPointsPotential(basePoints);
  }, [currentIndex, currentQuestion?.id, currentUser, hasTimeLimit, questionLimitSec, basePoints]);

  // Real-time ticking & dynamic time-decay scoring calculation
  useEffect(() => {
    if (!currentQuestion || isSubmitting || !currentUser) return;
    if (!hasTimeLimit) {
      setCurrentPointsPotential(basePoints);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      let elapsedSec = (now - questionStartTime) / 1000;

      // If scheduled synchronous decay is active:
      if (quiz?.scoring_strategy === 'time_decay' && decayStartSource === 'scheduled_start') {
        const scheduledTimeStr = currentRound?.scheduled_start_time || quiz?.start_time;
        if (scheduledTimeStr) {
          const scheduledMs = new Date(scheduledTimeStr).getTime();
          if (scheduledMs < now) {
            elapsedSec = Math.max(0, (now - scheduledMs) / 1000);
          }
        }
      }

      const remainingSec = Math.max(0, questionLimitSec - elapsedSec);
      setTimeRemaining(Math.ceil(remainingSec));

      if (quiz?.scoring_strategy === 'time_decay') {
        const fraction = Math.max(0, 1 - elapsedSec / questionLimitSec);
        const calculatedPoints = Math.round(basePoints * fraction);
        const dynamicPoints = Math.max(decayMinPoints, calculatedPoints);
        setCurrentPointsPotential(dynamicPoints);
      } else {
        setCurrentPointsPotential(basePoints);
      }

      // Auto advance if time runs out
      if (remainingSec <= 0) {
        clearInterval(interval);
        handleNextQuestion();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, currentQuestion, isSubmitting, currentUser, hasTimeLimit, questionLimitSec, basePoints, decayStartSource, decayMinPoints]);

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: [optionId],
    }));
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion || isSubmitting) return;

    const timeTakenMs = hasTimeLimit ? Math.min(Date.now() - questionStartTime, questionLimitSec * 1000) : Date.now() - questionStartTime;
    const chosenOptions = selectedAnswers[currentQuestion.id] || [];
    const timestampMs = Date.now();

    // Compute tamper-resistant cryptographic integrity hash
    const integrityHash = await generateAnswerIntegrityHash(
      sessionNonce,
      currentQuestion.id,
      chosenOptions,
      timeTakenMs,
      timestampMs
    );

    const updatedLog = [
      ...answersLog.filter((a) => a.questionId !== currentQuestion.id),
      {
        questionId: currentQuestion.id,
        selectedOptionIds: chosenOptions,
        timeTakenMs,
        clientAnsweredAt: new Date(timestampMs).toISOString(),
        integrityHash,
      },
    ];
    setAnswersLog(updatedLog);

    // Save attempt progress locally so network drop will not affect actual performance
    if (currentUser) {
      saveLocalAttemptProgress(quizId, currentUser.id, {
        answersLog: updatedLog,
        currentIndex: currentIndex + 1,
        selectedAnswers,
      });
    }

    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz(updatedLog);
    }
  };

  const finishQuiz = async (
    finalAnswersLog: typeof answersLog,
    status: 'submitted' | 'flagged_for_cheating' = 'submitted',
    violationsCount: number = antiCheat.violationCount
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const result = await submitQuizAttempt({
      quizId,
      roundId: roundId || null,
      answers: finalAnswersLog,
      status,
      violationsCount,
    });

    if (currentUser) {
      clearLocalAttemptProgress(quizId, currentUser.id);
    }

    setTimeout(() => {
      router.push(`/quiz/${quizId}/results?entryId=${result.entry.id}`);
    }, 800);
  };

  const antiCheat = useAntiCheat({
    enabled: quiz?.anti_cheat_enabled === true,
    maxViolations: quiz?.max_violations || 3,
    isActive: Boolean(quiz && currentUser && !isSubmitting && activeQuestions.length > 0),
    onMaxViolationsReached: (violationsCount) => {
      // Auto submit immediately on max violations
      finishQuiz(answersLog, 'flagged_for_cheating', violationsCount);
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
              href={`/quiz/${quizId}/results?entryId=${existingCompletedEntry.id}`}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>View Results & Answers</span>
            </Link>

            <Link
              href={`/quiz/${quizId}`}
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

          {!currentUser ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-500 font-medium">
                Sign in now to pre-register and get ready before the competition kicks off.
              </p>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    loginWithGoogle({
                      role: 'participant',
                      returnUrl: window.location.pathname + window.location.search,
                    });
                  }
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign In with Google to Get Ready</span>
              </button>

              <Link
                href={`/login`}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with Password</span>
              </Link>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Signed In as @{currentUser.username} • You are pre-registered and ready</span>
            </div>
          )}

          <div className="pt-2">
            <Link
              href={`/quiz/${quizId}`}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition flex items-center justify-center gap-2"
            >
              <span>Back to Overview & Live Countdown</span>
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
                  setQuestionStartTime(Date.now());
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

            <div className="relative flex items-center justify-center pt-2">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Or
              </span>
              <div className="border-t border-slate-200 w-full"></div>
            </div>

            <Link
              href={`/login`}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Username & Password</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (activeQuestions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Questions in this Level</h2>
        <p className="text-xs text-slate-500">Questions are being added by the organizers.</p>
        <button
          onClick={() => router.push(`/quiz/${quizId}`)}
          className="px-5 py-2.5 bg-[#e05a38] text-white rounded-2xl text-xs font-bold"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  const selectedForCurrent = (currentQuestion && selectedAnswers[currentQuestion.id]) || [];

  return (
    <div
      {...antiCheat.containerProps}
      className={`max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-3 ${antiCheat.containerProps.className}`}
    >
      {/* Arena Top Bar */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#ebdcd1] flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center font-bold text-[#e05a38] text-xs">
            {currentIndex + 1}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
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
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider line-clamp-1">
              {currentRound ? currentRound.title : quiz.title}
            </p>
          </div>
        </div>

        {/* Live Points Potential & Countdown */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#fffbeb] border border-[#fde68a]">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] text-slate-600 font-bold">Worth:</span>
            <span className="text-xs font-bold text-[#b45309] font-mono">+{currentPointsPotential} pts</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${hasTimeLimit && timeRemaining <= 5 ? 'text-rose-500 animate-bounce' : 'text-[#e05a38]'}`} />
            {hasTimeLimit ? (
              <span
                className={`text-sm sm:text-base font-bold font-mono ${
                  timeRemaining <= 5 ? 'text-rose-600 font-bold' : 'text-slate-900'
                }`}
              >
                {timeRemaining}s
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-lg">
                ∞ Unlimited
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#f3e5db] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#e05a38] h-full transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
        ></div>
      </div>

      {/* Compact Question Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#ebdcd1] space-y-3 shadow-md">
        <div className="space-y-1.5 select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#e05a38] uppercase tracking-wider">Single Choice</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold">Base: {currentQuestion.points} pts</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug select-none">
            {currentQuestion.question_text}
          </h2>
        </div>

        {/* Attachment (if any) */}
        {currentQuestion.attachment_url && currentQuestion.attachment_type === 'image' && (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-36 sm:max-h-44 flex items-center justify-center group select-none pointer-events-none">
            <img
              src={currentQuestion.attachment_url}
              alt="Question diagram"
              className="w-full h-auto max-h-36 sm:max-h-44 object-contain rounded-xl select-none pointer-events-none"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}

        {/* Options List */}
        <div className="grid grid-cols-1 gap-2 pt-1 select-none">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedForCurrent.includes(option.id);
            const letter = String.fromCharCode(65 + idx);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option.id)}
                className={`w-full p-2.5 sm:p-3 rounded-xl border sm:border-2 text-left transition flex items-center justify-between gap-3 select-none ${
                  isSelected
                    ? 'bg-[#fff0ea] border-[#e05a38] text-slate-950 shadow-sm shadow-[#e05a38]/10'
                    : 'bg-white border-[#ebdcd1] hover:border-slate-400 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono shrink-0 transition ${
                      isSelected
                        ? 'bg-[#e05a38] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold leading-tight select-none break-words">{option.text}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#e05a38] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2.5 flex items-center justify-between border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-semibold">
            {currentIndex + 1 === activeQuestions.length ? 'Final Question' : 'Speed earns bonus points'}
          </span>

          <button
            onClick={handleNextQuestion}
            disabled={selectedForCurrent.length === 0 || isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#e05a38] hover:bg-[#c84a29] disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-[#e05a38]/20 transition"
          >
            <span>
              {isSubmitting
                ? 'Submitting...'
                : currentIndex + 1 === activeQuestions.length
                ? 'Submit Final Answers'
                : 'Confirm & Next'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
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

export default function QuizPlayPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto py-20 text-center text-slate-400 text-xs">Loading Arena...</div>}>
      <QuizPlayContent />
    </Suspense>
  );
}

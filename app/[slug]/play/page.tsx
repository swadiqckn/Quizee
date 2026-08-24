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
import {
  getOrCreateSessionNonce,
  generateAnswerIntegrityHash,
  saveLocalAttemptProgress,
  clearLocalAttemptProgress,
} from '@/lib/tamperProof';

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
  const quizRounds = rounds.filter((r) => r.quiz_id === quiz?.id).sort((a, b) => a.round_number - b.round_number);
  const currentRound = roundId
    ? rounds.find((r) => r.id === roundId)
    : (quiz?.quiz_type === 'tournament'
        ? (rounds.find((r) => r.quiz_id === quiz?.id && r.status === 'active') || quizRounds[0] || null)
        : null);

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
    if (quiz.quiz_type === 'tournament') {
      const targetRoundId = roundId || currentRound?.id;
      if (targetRoundId) {
        return q.quiz_id === quiz.id && q.round_id === targetRoundId;
      }
    }
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
  // If the quiz itself has time_limit_per_question_sec = 0 (or null), the entire quiz has unlimited time per question
  const isQuizUnlimited = quiz?.time_limit_per_question_sec === 0 || quiz?.time_limit_per_question_sec === null;
  const rawQTime = isQuizUnlimited
    ? 0
    : (currentQ?.time_limit_sec !== undefined && currentQ?.time_limit_sec !== null
        ? currentQ.time_limit_sec
        : (quiz?.time_limit_per_question_sec ?? 0));

  const hasTimeLimit = Boolean(rawQTime && rawQTime > 0);
  const maxQTime = hasTimeLimit ? rawQTime : 0;
  const baseQPts = currentQ?.points || quiz?.base_points_per_question || 10;
  const decayStartSource = currentRound?.decay_start_source || quiz?.decay_start_source || 'question_open';
  const decayMinPoints = currentRound?.decay_min_points ?? quiz?.decay_min_points ?? 1;

  // Session Nonce for cryptographic tamper protection
  const sessionNonce = React.useMemo(() => {
    return getOrCreateSessionNonce(quiz?.id || 'quiz', currentUser?.id || 'anon');
  }, [quiz?.id, currentUser?.id]);

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

      const remaining = Math.max(0, maxQTime - elapsedSec);
      setTimeRemaining(remaining);

      if (quiz?.scoring_strategy === 'time_decay') {
        const decayFraction = Math.max(0, remaining / maxQTime);
        const calculatedPts = Math.round(baseQPts * decayFraction);
        const pts = Math.max(decayMinPoints, calculatedPts);
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
  }, [currentIndex, currentQ?.id, maxQTime, baseQPts, isSubmitting, hasTimeLimit, decayStartSource, decayMinPoints]);

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
    const timestampMs = Date.now();

    // Compute tamper-resistant cryptographic integrity hash
    const integrityHash = await generateAnswerIntegrityHash(
      sessionNonce,
      currentQ.id,
      chosenOptions,
      isAutoExpire ? maxQTime * 1000 : timeTakenMs,
      timestampMs
    );

    const newLogItem = {
      questionId: currentQ.id,
      selectedOptionIds: chosenOptions,
      timeTakenMs: isAutoExpire ? maxQTime * 1000 : timeTakenMs,
      clientAnsweredAt: new Date(timestampMs).toISOString(),
      integrityHash,
    };

    const nextAnswersLog = [...answersLog, newLogItem];
    setAnswersLog(nextAnswersLog);

    // Save attempt progress locally so network drop will not affect actual performance
    if (currentUser) {
      saveLocalAttemptProgress(quiz.id, currentUser.id, {
        answersLog: nextAnswersLog,
        currentIndex: currentIndex + 1,
        selectedAnswers,
      });
    }

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

    if (currentUser) {
      clearLocalAttemptProgress(quiz.id, currentUser.id);
    }

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

  // Check if participant already completed this specific quiz/round and retries are disallowed
  const existingCompletedEntry = entries.find((e) => {
    if (e.quiz_id !== quiz.id) return false;
    if (!currentUser || e.user_id !== currentUser.id) return false;
    if (e.status !== 'submitted' && e.status !== 'flagged_for_cheating') return false;

    // For tournament quizzes: check if this specific round was completed
    if (quiz.quiz_type === 'tournament') {
      const targetRoundId = roundId || currentRound?.id;
      if (targetRoundId) {
        return e.round_id === targetRoundId;
      }
      return false;
    }

    // For single quizzes: match the whole quiz
    return true;
  });

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
            <h1 className="text-2xl font-bold text-slate-900">
              {currentRound ? `${currentRound.title} Already Completed` : 'Attempt Already Completed'}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              You have already completed <strong className="text-slate-900">{currentRound ? `${quiz.title} (${currentRound.title})` : quiz.title}</strong>. This {currentRound ? 'round' : 'competition'} does not allow multiple attempts.
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

  // Check tournament progression & qualification for Round > 1
  if (quiz.quiz_type === 'tournament' && currentRound && currentRound.round_number > 1 && currentUser) {
    const prevRound = quizRounds.find((r) => r.round_number === currentRound.round_number - 1);
    if (prevRound) {
      const prevEntry = entries.find(
        (e) =>
          e.quiz_id === quiz.id &&
          e.round_id === prevRound.id &&
          e.user_id === currentUser.id &&
          (e.status === 'submitted' || e.status === 'flagged_for_cheating')
      );

      if (!prevEntry) {
        return (
          <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-[#ebdcd1] shadow-2xl space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                  Prerequisite Round Required
                </span>
                <h1 className="text-2xl font-bold text-slate-900">Complete Previous Round First</h1>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  You must complete <strong className="text-slate-900">{prevRound.title}</strong> before entering {currentRound.title}.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <Link
                  href={`/${slug}/play?roundId=${prevRound.id}`}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/25 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Play {prevRound.title}</span>
                </Link>
                <Link
                  href={`/${slug}`}
                  className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition block text-center"
                >
                  Back to Overview
                </Link>
              </div>
            </div>
          </div>
        );
      }

      if (prevEntry.qualified_for_next_round === false) {
        return (
          <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-[#ebdcd1] shadow-2xl space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                  Qualification Not Met
                </span>
                <h1 className="text-2xl font-bold text-slate-900">Did Not Qualify for {currentRound.title}</h1>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Your score of <strong className="text-slate-900">{prevEntry.score} pts</strong> ({prevEntry.total_correct} correct) in {prevRound.title} did not meet the minimum qualification threshold (min {prevRound.min_score_to_qualify || 0} pts).
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <Link
                  href={`/${slug}/results?entryId=${prevEntry.id}`}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/25 transition flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>View {prevRound.title} Results</span>
                </Link>
                <Link
                  href={`/${slug}`}
                  className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition block text-center"
                >
                  Back to Overview
                </Link>
              </div>
            </div>
          </div>
        );
      }
    }
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
              href={`/${slug}`}
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
      className={`max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-3 ${antiCheat.containerProps.className}`}
    >
      {/* Top Arena HUD Bar */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#ebdcd1] shadow-xs flex items-center justify-between gap-3">
        {/* Left: Round & Question Progress */}
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

        {/* Center: Live Dynamic Points Potential */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#fff9f6] border border-[#ffd8cb]">
          <Zap className="w-3.5 h-3.5 text-[#e05a38] animate-pulse" />
          <span className="text-[11px] font-bold text-slate-700">Worth:</span>
          <span className="text-xs font-bold text-[#e05a38] font-mono">+{currentPointsPotential} pts</span>
        </div>

        {/* Right: Real-time Countdown Timer or Unlimited Badge */}
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${hasTimeLimit && timeRemaining <= 5 ? 'text-rose-500 animate-bounce' : 'text-[#e05a38]'}`} />
          {hasTimeLimit ? (
            <span
              className={`text-sm sm:text-base font-bold font-mono ${
                timeRemaining <= 5 ? 'text-rose-600 font-bold' : 'text-slate-900'
              }`}
            >
              {timeRemaining.toFixed(1)}s
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-lg">
              ∞ Unlimited
            </span>
          )}
        </div>
      </div>

      {/* Timer Progress Bar (Only when time limit is active) */}
      {hasTimeLimit && (
        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              timeRemaining <= 5 ? 'bg-rose-500' : 'bg-[#e05a38]'
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      )}

      {/* Compact Question Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#ebdcd1] shadow-md space-y-3">
        {/* Question Text */}
        <div className="space-y-1.5 select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#e05a38] uppercase tracking-wider">Single Choice</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold">Base: {currentQ.points} pts</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug select-none">
            {currentQ.question_text}
          </h2>
        </div>

        {/* Attachment Media if present */}
        {currentQ.attachment_url && (
          <div className="rounded-xl overflow-hidden border border-slate-200 max-h-36 sm:max-h-44 bg-slate-50 flex items-center justify-center relative group select-none pointer-events-none">
            <img
              src={currentQ.attachment_url}
              alt="Question media"
              className="max-h-36 sm:max-h-44 object-contain w-full select-none pointer-events-none"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}

        {/* MCQ Options Grid */}
        <div className="grid grid-cols-1 gap-2 pt-1 select-none">
          {currentQ.options.map((option, idx) => {
            const isSelected = currentSelection.includes(option.id);
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
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 transition ${
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

        {/* Submit / Next Action Bar */}
        <div className="pt-2.5 flex items-center justify-between border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-semibold">
            {currentIndex + 1 === activeQuestions.length ? 'Final Question' : 'Speed earns bonus points'}
          </span>

          <button
            type="button"
            onClick={() => handleNextQuestion(false)}
            disabled={isSubmitting || currentSelection.length === 0}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#e05a38] hover:bg-[#c84a29] disabled:opacity-40 disabled:hover:bg-[#e05a38] text-white font-bold text-xs shadow-md shadow-[#e05a38]/20 transition flex items-center gap-1.5"
          >
            <span>
              {isSubmitting
                ? 'Submitting...'
                : currentIndex + 1 === activeQuestions.length
                ? 'Finish Attempt'
                : 'Next Question'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
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

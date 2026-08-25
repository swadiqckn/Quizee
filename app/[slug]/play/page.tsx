// app/[slug]/play/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Zap,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Trophy,
  LogIn,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { shuffleArray, calculateQuestionPoints, getDecayStartTimestamp } from '@/lib/scoring';
import { Question } from '@/lib/types';
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

  useEffect(() => {
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
    Array<{ questionId: string; selectedOptionIds: string[]; timeTakenMs: number; clientAnsweredAt: string; integrityHash: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const isQuizUnlimited = quiz?.time_limit_per_question_sec === 0 || quiz?.time_limit_per_question_sec === null;
  const rawQTime = isQuizUnlimited
    ? 0
    : (currentQ?.time_limit_sec !== undefined && currentQ?.time_limit_sec !== null
        ? currentQ.time_limit_sec
        : (quiz?.time_limit_per_question_sec ?? 0));

  const hasTimeLimit = Boolean(rawQTime && rawQTime > 0);
  const maxQTime = hasTimeLimit ? rawQTime : 0;
  const baseQPts = currentQ?.points || quiz?.base_points_per_question || 10;
  const decayMinPoints = currentRound?.decay_min_points ?? quiz?.decay_min_points ?? 0;

  const sessionNonce = React.useMemo(() => {
    return getOrCreateSessionNonce(quiz?.id || 'quiz', currentUser?.id || 'anon');
  }, [quiz?.id, currentUser?.id]);

  useEffect(() => {
    if (!currentQ || isSubmitting) return;

    const startTimestamp = Date.now();
    setQuestionStartTime(startTimestamp);

    if (!hasTimeLimit) {
      setTimeRemaining(0);
      setCurrentPointsPotential(baseQPts);
      return;
    }

    setTimeRemaining(maxQTime);
    setCurrentPointsPotential(baseQPts);

    const decayStartTimestamp = getDecayStartTimestamp(quiz, currentRound);

    const interval = setInterval(() => {
      const now = Date.now();
      
      const questionElapsedSec = (now - startTimestamp) / 1000;
      const remainingQuestionTime = Math.max(0, maxQTime - questionElapsedSec);
      setTimeRemaining(remainingQuestionTime);

      let decayElapsedSec = questionElapsedSec;
      if (decayStartTimestamp) {
        const rawDecayElapsed = (now - decayStartTimestamp) / 1000;
        decayElapsedSec = Math.max(0, rawDecayElapsed);
      }

      if (quiz?.scoring_strategy === 'time_decay') {
        const calculatedPts = calculateQuestionPoints({
          strategy: quiz.scoring_strategy,
          basePoints: baseQPts,
          timeLimitSec: maxQTime,
          timeTakenMs: questionElapsedSec * 1000,
          decayElapsedMs: decayElapsedSec * 1000,
          isCorrect: true,
          decayMinPoints,
        });
        setCurrentPointsPotential(calculatedPts);
      } else {
        setCurrentPointsPotential(baseQPts);
      }

      if (remainingQuestionTime <= 0) {
        clearInterval(interval);
        handleNextQuestion(true); 
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, currentQ?.id, maxQTime, baseQPts, isSubmitting, hasTimeLimit, quiz, currentRound, decayMinPoints]);

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

  const antiCheat = useAntiCheat({
    enabled: quiz?.anti_cheat_enabled === true,
    maxViolations: quiz?.max_violations || 3,
    isActive: Boolean(quiz && currentUser && !isSubmitting && activeQuestions.length > 0),
    onMaxViolationsReached: (violationsCount) => {
      handleCompleteAttempt(answersLog, 'flagged_for_cheating', violationsCount);
    },
  });

  const handleCompleteAttempt = async (
    finalAnswersLog: Array<{ questionId: string; selectedOptionIds: string[]; timeTakenMs: number; clientAnsweredAt: string; integrityHash: string }>,
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

  const existingCompletedEntry = entries.find((e) => {
    if (e.quiz_id !== quiz.id) return false;
    if (!currentUser || e.user_id !== currentUser.id) return false;
    if (e.status !== 'submitted' && e.status !== 'flagged_for_cheating') return false;

    if (quiz.quiz_type === 'tournament') {
      const targetRoundId = roundId || currentRound?.id;
      if (targetRoundId) {
        return e.round_id === targetRoundId;
      }
      return false;
    }

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
              This {currentRound ? 'round' : 'competition'} is scheduled to begin at <strong className="text-slate-900">{formatDate(scheduledStartTimeStr)}</strong>. Please return when it starts.
            </p>
          </div>

          <div className="pt-2">
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

  if (!currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-[#ebdcd1] shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#e05a38]/10 border border-[#e05a38]/20 flex items-center justify-center mx-auto text-[#e05a38] shadow-sm">
            <LogIn className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#e05a38]/10 text-[#e05a38] text-[10px] font-bold uppercase tracking-wider">
              Authentication Required
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Sign In to Play</h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              You must be signed in with your Google account to participate in <strong className="text-slate-900">{quiz.title}</strong> and record your score on the leaderboard.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => loginWithGoogle()}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/25 transition flex items-center justify-center gap-2.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>

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

  if (activeQuestions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Questions Available</h2>
        <p className="text-xs text-slate-500 font-medium">This competition currently has no active questions published.</p>
        <Link href={`/${slug}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] text-white text-xs font-bold hover:bg-[#c84a29] transition shadow-sm mt-2">
          Back to Overview
        </Link>
      </div>
    );
  }

  const selectedOptionIds = currentQ ? selectedAnswers[currentQ.id] || [] : [];
  const { className: antiCheatClassName, style: antiCheatStyle, ...antiCheatEvents } = antiCheat.containerProps;

  return (
    <div 
      className={`min-h-screen bg-[#faf7f5] pb-16 ${antiCheatClassName || ''}`}
      style={antiCheatStyle}
      {...antiCheatEvents}
    >
      {quiz?.anti_cheat_enabled && (
        <>
          <AntiCheatWarningModal
  isOpen={antiCheat.isWarningModalOpen}
  violationCount={antiCheat.violationCount} // <-- Change this prop name
  maxViolations={quiz.max_violations || 3}
  onDismiss={antiCheat.dismissWarning}
/>

          <AntiCheatFullscreenGate
            isOpen={antiCheat.isFullScreenSupported && !antiCheat.isFullscreen}
            onRequestFullscreen={antiCheat.enterFullscreen}
          />
        </>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#ebdcd1] px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#e05a38]/10 text-[#e05a38] flex items-center justify-center font-bold text-xs">
              {currentIndex + 1}
            </span>
            <div>
              <h2 className="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">{quiz.title}</h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Question {currentIndex + 1} of {activeQuestions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {quiz?.anti_cheat_enabled && (
              <AntiCheatStatusBadge
                violationCount={antiCheat.violationCount}
                maxViolations={quiz.max_violations || 3}
              />
            )}

            {hasTimeLimit && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>{Math.ceil(timeRemaining)}s</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentPointsPotential} pts</span>
            </div>
          </div>
        </div>
      </header>

      {/* Question Card & Options */}
      <main className="max-w-3xl mx-auto px-4 pt-8">
        <div className="bg-white border border-[#ebdcd1] rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
          {/* Question Text */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                Question {currentIndex + 1}
              </span>
              <span className="text-xs text-slate-600 font-bold">
                {currentQ?.points || 10} Base Points
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQ?.question_text}
            </h1>
            {currentQ?.image_url && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-64 bg-slate-50 flex items-center justify-center">
                <img src={currentQ.image_url} alt="Question media" className="object-contain max-h-64 w-full" />
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3.5">
            {currentQ?.options?.map((option, idx) => {
              const isSelected = selectedOptionIds.includes(option.id);
              const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'border-[#e05a38] bg-[#e05a38]/5 text-slate-900 shadow-md shadow-[#e05a38]/5'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#e05a38] text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {optionLetters[idx] || idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold">{option.option_text}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-[#e05a38] bg-[#e05a38] text-white'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] text-slate-600 font-bold">
              {selectedOptionIds.length > 0 ? 'Option selected' : 'Select an option to proceed'}
            </p>
            <button
              onClick={() => handleNextQuestion(false)}
              disabled={isSubmitting || selectedOptionIds.length === 0}
              className="px-6 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition flex items-center gap-2"
            >
              <span>{currentIndex + 1 < activeQuestions.length ? 'Next Question' : 'Submit Attempt'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SlugQuizPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold">Loading Arena...</p>
        </div>
      }
    >
      <SlugQuizPlayContent />
    </Suspense>
  );
}

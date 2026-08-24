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
      const elapsedMs = Date.now() - questionStartTime;
      const elapsedSec = elapsedMs / 1000;
      const remainingSec = Math.max(0, questionLimitSec - elapsedSec);
      setTimeRemaining(Math.ceil(remainingSec));

      if (quiz?.scoring_strategy === 'time_decay') {
        const fraction = Math.max(0, 1 - elapsedSec / questionLimitSec);
        const dynamicPoints = Math.max(1, Math.round(basePoints * fraction));
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
  }, [currentIndex, currentQuestion, isSubmitting, currentUser, hasTimeLimit, questionLimitSec, basePoints]);

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: [optionId],
    }));
  };

  const handleNextQuestion = () => {
    if (!currentQuestion || isSubmitting) return;

    const timeTakenMs = hasTimeLimit ? Math.min(Date.now() - questionStartTime, questionLimitSec * 1000) : Date.now() - questionStartTime;
    const chosenOptions = selectedAnswers[currentQuestion.id] || [];

    const updatedLog = [
      ...answersLog.filter((a) => a.questionId !== currentQuestion.id),
      {
        questionId: currentQuestion.id,
        selectedOptionIds: chosenOptions,
        timeTakenMs,
      },
    ];
    setAnswersLog(updatedLog);

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

          <div className="pt-2">
            <Link
              href={`/quiz/${quizId}`}
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
      className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 ${antiCheat.containerProps.className}`}
    >
      {/* Arena Top Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#ebdcd1] flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#e05a38] uppercase tracking-wider">
              {currentRound ? currentRound.title : quiz.title}
            </span>
            <AntiCheatStatusBadge
              enabled={quiz.anti_cheat_enabled}
              violationCount={antiCheat.violationCount}
              maxViolations={antiCheat.maxViolations}
              isFullscreen={antiCheat.isFullscreen}
            />
          </div>
          <h1 className="text-sm font-bold text-slate-900">
            Question {currentIndex + 1} of {activeQuestions.length}
          </h1>
        </div>

        {/* Live Points Potential & Countdown */}
        <div className="flex items-center gap-4">
          <div className="px-3.5 py-1.5 rounded-2xl bg-[#fffbeb] border border-[#fde68a] flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-[10px] text-slate-500 font-bold block leading-none">Potential Score</span>
              <span className="text-xs font-bold text-[#b45309] font-mono">
                {currentPointsPotential} pts
              </span>
            </div>
          </div>

          {hasTimeLimit ? (
            <div
              className={`px-3.5 py-1.5 rounded-2xl border flex items-center gap-2 transition-colors ${
                timeRemaining <= 5
                  ? 'bg-rose-50 border-rose-400 text-rose-600 animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4 text-[#e05a38]" />
              <span className="text-sm font-bold font-mono">{timeRemaining}s</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-2xl border bg-slate-50 border-slate-200 text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold font-mono">∞ Unlimited Time</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#f3e5db] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#e05a38] h-full transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-xl">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed select-none">
          {currentQuestion.question_text}
        </h2>

        {/* Attachment (if any) */}
        {currentQuestion.attachment_url && currentQuestion.attachment_type === 'image' && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-80 flex items-center justify-center group select-none pointer-events-none">
            <img
              src={currentQuestion.attachment_url}
              alt="Question diagram"
              className="w-full h-auto max-h-80 object-contain rounded-xl select-none pointer-events-none"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}

        {/* Options List */}
        <div className="space-y-3 pt-2 select-none">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedForCurrent.includes(option.id);
            const letter = String.fromCharCode(65 + idx);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center gap-4 select-none ${
                  isSelected
                    ? 'bg-[#fff0ea] border-[#e05a38] text-slate-900 shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-[#fff9f6] hover:border-[#ffd8cb]'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                    isSelected
                      ? 'bg-[#e05a38] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {letter}
                </span>
                <span className="text-xs sm:text-sm font-bold flex-1 select-none">{option.text}</span>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-[#e05a38] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-4 flex items-center justify-end">
          <button
            onClick={handleNextQuestion}
            disabled={selectedForCurrent.length === 0 || isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] disabled:opacity-40 text-white font-bold text-xs shadow-xl shadow-[#e05a38]/25 transition hover:scale-105"
          >
            <span>
              {currentIndex + 1 === activeQuestions.length ? 'Submit Final Answers' : 'Confirm & Next Question'}
            </span>
            <ArrowRight className="w-4 h-4" />
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

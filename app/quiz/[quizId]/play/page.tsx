'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { shuffleArray } from '@/lib/scoring';
import { Question, QuestionOption } from '@/lib/types';

function QuizPlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const quizId = params.quizId as string;
  const roundId = searchParams.get('roundId');

  const { quizzes, rounds, questions, submitQuizAttempt, currentUser } = useQuizPlatform();

  const quiz = quizzes.find((q) => q.id === quizId);
  const currentRound = roundId ? rounds.find((r) => r.id === roundId) : null;

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

    // Process option shuffling
    const processedQuestions = qList.map((q) => {
      let opts = [...q.options];
      if (quiz?.shuffle_options) {
        opts = shuffleArray(opts);
      }
      return { ...q, options: opts };
    });

    setActiveQuestions(processedQuestions);
    setCurrentIndex(0);
    setAnswersLog([]);
    setQuestionStartTime(Date.now());
  }, [quizId, roundId]);

  const currentQuestion: Question | undefined = activeQuestions[currentIndex];
  const questionLimitSec = currentQuestion?.time_limit_sec || quiz?.time_limit_per_question_sec || 15;
  const basePoints = currentQuestion?.points || quiz?.base_points_per_question || 10;

  // Timer Tick and Real-time Point Decay Engine
  useEffect(() => {
    if (!currentQuestion || isSubmitting) return;

    setTimeRemaining(questionLimitSec);
    setCurrentPointsPotential(basePoints);
    setQuestionStartTime(Date.now());

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
  }, [currentIndex, currentQuestion, isSubmitting]);

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: [optionId], // Single select MCQ
    }));
  };

  const handleNextQuestion = () => {
    if (!currentQuestion || isSubmitting) return;

    const timeTakenMs = Math.min(Date.now() - questionStartTime, questionLimitSec * 1000);
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

  const finishQuiz = (finalAnswers: typeof answersLog) => {
    setIsSubmitting(true);
    const result = submitQuizAttempt({
      quizId,
      roundId: roundId || null,
      answers: finalAnswers,
    });

    setTimeout(() => {
      router.push(`/quiz/${quizId}/results?entryId=${result.entry.id}`);
    }, 800);
  };

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center text-white">
        <p>Quiz not found.</p>
      </div>
    );
  }

  if (activeQuestions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Questions in this Level</h2>
        <p className="text-xs text-slate-400">Questions are being added by the organizers.</p>
        <button
          onClick={() => router.push(`/quiz/${quizId}`)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  const selectedForCurrent = (currentQuestion && selectedAnswers[currentQuestion.id]) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Arena Top Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
            {currentIndex + 1}/{activeQuestions.length}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">{quiz.title}</h2>
            <p className="text-[11px] text-slate-400">
              {currentRound ? currentRound.title : 'Single Round Arena'}
            </p>
          </div>
        </div>

        {/* Dynamic Scoring & Timer Widget */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Worth {currentPointsPotential} pts</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-mono text-xs font-bold transition-colors ${
              timeRemaining <= 5
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{timeRemaining}s</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Question {currentIndex + 1}
              </span>
              <span className="text-xs text-slate-400">
                Max Time: {questionLimitSec}s
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQuestion.question_text}
            </h1>
          </div>

          {/* Optional Media Attachment */}
          {currentQuestion.attachment_url && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 p-2 max-h-80 flex items-center justify-center">
              {currentQuestion.attachment_type === 'image' ? (
                <div className="relative group cursor-pointer" onClick={() => setImageModalOpen(true)}>
                  <img
                    src={currentQuestion.attachment_url}
                    alt="Question Diagram"
                    className="max-h-72 object-contain rounded-xl"
                  />
                  <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-center gap-3 text-slate-300">
                  <Volume2 className="w-6 h-6 text-indigo-400" />
                  <span className="text-xs">Audio attachment attached</span>
                </div>
              )}
            </div>
          )}

          {/* MCQ Options Grid */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedForCurrent.includes(option.id);
              const optionLetters = ['A', 'B', 'C', 'D', 'E'];

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10 text-white'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold border transition ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:border-slate-700'
                      }`}
                    >
                      {optionLetters[idx] || idx + 1}
                    </div>
                    <span className="text-sm font-medium">{option.text}</span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected ? 'border-indigo-500 bg-indigo-600' : 'border-slate-700'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Action */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800/80">
            <span className="text-xs text-slate-500">
              {quiz.scoring_strategy === 'time_decay'
                ? '⚡ Fast response locks in higher points'
                : '🎯 Standard fixed score'}
            </span>

            <button
              onClick={handleNextQuestion}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition hover:scale-105 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Evaluating Attempt...'
                : currentIndex + 1 === activeQuestions.length
                ? 'Submit Quiz'
                : 'Next Question'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Image Modal for attachments */}
      {imageModalOpen && currentQuestion?.attachment_url && (
        <div
          onClick={() => setImageModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <img
            src={currentQuestion.attachment_url}
            alt="Expanded Diagram"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

export default function QuizPlayArena() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto py-20 text-center text-slate-400 text-xs">Loading arena...</div>}>
      <QuizPlayContent />
    </Suspense>
  );
}

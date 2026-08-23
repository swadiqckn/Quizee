'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Trophy,
  Zap,
  Clock,
  Layers,
  Sparkles,
  Users,
  Shield,
  Shuffle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Gift,
  Share2,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatDate } from '@/lib/utils';

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const { quizzes, rounds, questions, entries, currentUser } = useQuizPlatform();

  const quiz = quizzes.find((q) => q.id === quizId);
  const quizRounds = rounds.filter((r) => r.quiz_id === quizId).sort((a, b) => a.round_number - b.round_number);
  const quizQuestions = questions.filter((q) => q.quiz_id === quizId);
  const userEntries = entries.filter((e) => e.quiz_id === quizId && (currentUser ? e.user_id === currentUser.id : false));

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Competition Not Found</h2>
        <Link href="/explore" className="text-indigo-400 text-xs hover:underline">
          Back to Explore
        </Link>
      </div>
    );
  }

  // Active round detection
  const activeRound = quiz.quiz_type === 'tournament'
    ? quizRounds.find((r) => r.status === 'active') || quizRounds[0]
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Banner / Title Header */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-10 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                quiz.quiz_type === 'tournament'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {quiz.quiz_type === 'tournament' ? <Layers className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              <span className="capitalize">{quiz.quiz_type} Mode</span>
            </span>

            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              {quiz.scoring_strategy === 'time_decay' ? '⚡ Time-Decay Scoring' : '🎯 Fixed Scoring'}
            </span>

            {quiz.progression_mode && (
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                Progression: <strong className="capitalize">{quiz.progression_mode}</strong>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {quiz.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{quiz.description}</p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <p className="text-[11px] text-slate-500 font-medium">Time / Question</p>
              <p className="text-base font-bold text-white mt-0.5">{quiz.time_limit_per_question_sec}s</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <p className="text-[11px] text-slate-500 font-medium">Base Points</p>
              <p className="text-base font-bold text-indigo-400 mt-0.5">+{quiz.base_points_per_question} pts</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <p className="text-[11px] text-slate-500 font-medium">Option Shuffle</p>
              <p className="text-base font-bold text-white mt-0.5">{quiz.shuffle_options ? 'Enabled' : 'Disabled'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <p className="text-[11px] text-slate-500 font-medium">Referral Bonus</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">
                {quiz.enable_referral_bonus ? `+${quiz.referral_bonus_points} pts` : 'None'}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/quiz/${quiz.id}/play${activeRound ? `?roundId=${activeRound.id}` : ''}`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              {activeRound ? `Enter Arena: ${activeRound.title}` : 'Enter Competition Arena'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/referrals"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition"
            >
              <Gift className="w-4 h-4 text-pink-400" />
              Invite Friends (+{quiz.referral_bonus_points || 10} pts)
            </Link>
          </div>
        </div>
      </div>

      {/* Tournament Rounds Breakdown (if Tournament) */}
      {quiz.quiz_type === 'tournament' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Tournament Levels & Round Progression
            </h2>
            <span className="text-xs text-slate-400">
              {quiz.progression_mode === 'automatic'
                ? '🕒 Automatic time-based schedule'
                : '🛡️ Manual organizer qualification'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizRounds.map((round) => {
              const isActive = round.status === 'active';
              const isCompleted = round.status === 'completed';
              const roundQuestions = questions.filter((q) => q.round_id === round.id);

              return (
                <div
                  key={round.id}
                  className={`p-6 rounded-2xl border transition relative ${
                    isActive
                      ? 'bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-900/20'
                      : 'bg-slate-900/50 border-slate-800/80 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Level {round.round_number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isCompleted
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {round.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{round.title}</h3>

                  <div className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span>Schedule:</span>
                      <span className="text-slate-200">{formatDate(round.scheduled_start_time)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Qualification Threshold:</span>
                      <span className="text-amber-300 font-semibold">
                        Min {round.min_score_to_qualify} pts / {round.min_correct_to_qualify} correct
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Advancing Qualifiers:</span>
                      <span className="text-slate-200">{round.max_qualifiers || 'Unlimited'} participants</span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        Round is Currently Live
                      </span>
                      <Link
                        href={`/quiz/${quiz.id}/play?roundId=${round.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                      >
                        Play Level {round.round_number}
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Rules & Scoring Explanation Card */}
      <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          Rules & Scoring Dynamics
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <li className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
            <strong className="text-slate-200 block text-xs">Dynamic Speed Decay</strong>
            {quiz.scoring_strategy === 'time_decay'
              ? 'Answering faster awards higher points. Points decay continuously during the question timer.'
              : 'Fixed points awarded for every correct answer regardless of speed.'}
          </li>
          <li className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
            <strong className="text-slate-200 block text-xs">Anti-Cheat Shuffling</strong>
            Questions and MCQ choices are randomized dynamically for every participant session.
          </li>
          <li className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
            <strong className="text-slate-200 block text-xs">Progression Qualification</strong>
            In tournaments, you must achieve the minimum score threshold to unlock subsequent rounds.
          </li>
        </ul>
      </section>
    </div>
  );
}

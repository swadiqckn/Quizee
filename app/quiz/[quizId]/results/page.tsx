'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Zap,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Share2,
  ArrowRight,
  Gift,
  Award,
  Users,
  Repeat,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatTimeMs, formatDate } from '@/lib/utils';

function QuizResultsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.quizId as string;
  const entryId = searchParams.get('entryId');

  const { quizzes, rounds, entries, winners, currentUser } = useQuizPlatform();
  const [copiedLink, setCopiedLink] = useState(false);

  const quiz = quizzes.find((q) => q.id === quizId);
  const entry = entries.find((e) => e.id === entryId) || entries[0];
  const round = entry?.round_id ? rounds.find((r) => r.id === entry.round_id) : null;
  const nextRound = round
    ? rounds.find((r) => r.quiz_id === quizId && r.round_number === round.round_number + 1)
    : null;

  // Trigger celebratory confetti on high score or qualification
  useEffect(() => {
    if (entry?.qualified_for_next_round || (entry && entry.score > 0)) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [entry?.id]);

  const copyReferral = () => {
    const inviteUrl = `${window.location.origin}/explore?ref=${currentUser.referral_code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!quiz || !entry) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center text-white">
        <p>Results not found.</p>
        <Link href="/explore" className="text-indigo-400 text-xs mt-2 block">
          Back to Explore
        </Link>
      </div>
    );
  }

  // Calculate leaderboard for this round
  const roundEntries = entries
    .filter((e) => e.quiz_id === quizId && (round ? e.round_id === round.id : true))
    .sort((a, b) => b.score - a.score || a.total_time_taken_ms - b.total_time_taken_ms);

  const userRank = roundEntries.findIndex((e) => e.id === entry.id) + 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Celebration Header Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.2),rgba(255,255,255,0))] pointer-events-none"></div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
          <Trophy className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">
            {entry.qualified_for_next_round
              ? '🎉 Qualification Achieved!'
              : entry.score > 0
              ? 'Quiz Completed!'
              : 'Attempt Submitted'}
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {quiz.title} {round ? `• ${round.title}` : ''}
          </p>
        </div>

        {/* Tournament Qualification Status Banner */}
        {quiz.quiz_type === 'tournament' && (
          <div
            className={`p-4 rounded-2xl border max-w-lg mx-auto text-left flex items-start gap-3.5 ${
              entry.qualified_for_next_round
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}
          >
            {entry.qualified_for_next_round ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">
                {entry.qualified_for_next_round ? 'Qualified for Next Level' : 'Did Not Meet Cut-Off'}
              </p>
              <p className="text-xs opacity-90 leading-relaxed">
                {entry.qualified_for_next_round
                  ? nextRound
                    ? `You have unlocked ${nextRound.title}. It begins ${formatDate(nextRound.scheduled_start_time)}.`
                    : 'Congratulations! You have cleared all tournament qualification stages.'
                  : `Threshold required: Min ${round?.min_score_to_qualify || 0} pts & ${round?.min_correct_to_qualify || 0} correct answers.`}
              </p>
            </div>
          </div>
        )}

        {/* Score & Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-[11px] text-slate-500 font-medium">Final Score</p>
            <p className="text-2xl font-black text-indigo-400">{entry.score} pts</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-[11px] text-slate-500 font-medium">Correct Answers</p>
            <p className="text-2xl font-black text-emerald-400">{entry.total_correct}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-[11px] text-slate-500 font-medium">Total Speed</p>
            <p className="text-2xl font-black text-white">{formatTimeMs(entry.total_time_taken_ms)}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-[11px] text-slate-500 font-medium">Arena Rank</p>
            <p className="text-2xl font-black text-amber-400">#{userRank || 1}</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {nextRound && entry.qualified_for_next_round && (
            <Link
              href={`/quiz/${quiz.id}/play?roundId=${nextRound.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition hover:scale-105"
            >
              Proceed to {nextRound.title}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href={`/quiz/${quiz.id}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition"
          >
            <Repeat className="w-3.5 h-3.5" />
            Back to Overview
          </Link>
        </div>
      </div>

      {/* Referral Booster Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-950/30 via-slate-900 to-indigo-950/30 border border-pink-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Boost Your Standing with Referrals</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Invite friends to this tournament and earn{' '}
              <strong className="text-pink-400">+{quiz.referral_bonus_points || 10} bonus points</strong> for each referee!
            </p>
          </div>
        </div>

        <button
          onClick={copyReferral}
          className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-md shadow-pink-600/20"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copiedLink ? 'Invite Link Copied!' : 'Share Referral Link'}
        </button>
      </div>

      {/* Live Round Leaderboard */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Live Arena Leaderboard
          </h2>
          <span className="text-xs text-slate-400">{roundEntries.length} entries recorded</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {roundEntries.map((e, index) => {
            const isMe = e.user_id === currentUser.id;
            const rank = index + 1;

            return (
              <div
                key={e.id}
                className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-4 transition ${
                  isMe ? 'bg-indigo-600/10 border border-indigo-500/20' : 'hover:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      rank === 1
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : rank === 2
                        ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                        : rank === 3
                        ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                        : 'text-slate-500 font-mono'
                    }`}
                  >
                    {rank}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      {e.user?.full_name || `@${e.user?.username}` || 'Anonymous Competitor'}
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500 text-white font-bold">
                          YOU
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Time: {formatTimeMs(e.total_time_taken_ms)} • {e.total_correct} Correct
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-400">{e.score} pts</p>
                  {e.qualified_for_next_round && (
                    <span className="text-[10px] text-emerald-400 font-medium">Qualified</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto py-20 text-center text-slate-400 text-xs">Loading results...</div>}>
      <QuizResultsContent />
    </Suspense>
  );
}

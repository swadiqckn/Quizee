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
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [entry?.id]);

  const copyReferral = () => {
    const inviteUrl = currentUser
      ? `${window.location.origin}/explore?ref=${currentUser.referral_code}`
      : `${window.location.origin}/explore`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!quiz || !entry) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center text-slate-900 font-bold">
        <p>Results not found.</p>
        <Link href="/explore" className="text-[#e05a38] text-xs mt-2 block hover:underline">
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
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#ebdcd1] text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center mx-auto shadow-sm">
          <Trophy className="w-8 h-8 text-[#e05a38]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">
            {entry.qualified_for_next_round
              ? '🎉 Qualification Achieved!'
              : entry.score > 0
              ? 'Quiz Completed!'
              : 'Attempt Submitted'}
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
            {quiz.title} {round ? `• ${round.title}` : ''}
          </p>
        </div>

        {/* Tournament Qualification Status Banner */}
        {quiz.quiz_type === 'tournament' && (
          <div
            className={`p-5 rounded-2xl border-2 max-w-lg mx-auto text-left flex items-start gap-3.5 ${
              entry.qualified_for_next_round
                ? 'bg-[#f0fdf4] border-[#10b981] text-[#15803d]'
                : 'bg-[#fffbeb] border-[#f59e0b] text-[#b45309]'
            }`}
          >
            {entry.qualified_for_next_round ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981] mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-[#f59e0b] mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">
                {entry.qualified_for_next_round ? 'Qualified for Next Level' : 'Did Not Meet Cut-Off'}
              </p>
              <p className="text-xs opacity-90 leading-relaxed font-semibold">
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
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-bold">Final Score</p>
            <p className="text-2xl font-bold text-[#e05a38]">{entry.score} pts</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-bold">Correct Answers</p>
            <p className="text-2xl font-bold text-[#15803d]">{entry.total_correct}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-bold">Total Speed</p>
            <p className="text-2xl font-bold text-slate-900">{formatTimeMs(entry.total_time_taken_ms)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] text-slate-500 font-bold">Arena Rank</p>
            <p className="text-2xl font-bold text-[#b45309]">#{userRank || 1}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
          <Link
            href={`/quiz/${quizId}/play`}
            className="px-6 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-bold shadow-lg shadow-[#e05a38]/20 transition flex items-center gap-2"
          >
            <Repeat className="w-3.5 h-3.5" />
            Try Again
          </Link>

          <button
            onClick={copyReferral}
            className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold shadow-sm transition flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5 text-[#e05a38]" />
            {copiedLink ? 'Link Copied!' : 'Share Referral & Earn Bonus'}
          </button>
        </div>
      </div>

      {/* Live Standings Leaderboard */}
      <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Round Leaderboard Standings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ranked by points (speed decay) and completion duration</p>
          </div>
          <span className="text-xs font-bold text-slate-500">{roundEntries.length} entries recorded</span>
        </div>

        <div className="divide-y divide-slate-100">
          {roundEntries.map((e, index) => {
            const isMe = currentUser ? e.user_id === currentUser.id : false;
            const rank = index + 1;

            return (
              <div
                key={e.id}
                className={`py-4 px-4 rounded-2xl flex items-center justify-between gap-4 transition ${
                  isMe ? 'bg-[#fff0ea] border border-[#ffd8cb]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      rank === 1
                        ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                        : rank === 2
                        ? 'bg-slate-200 text-slate-700 border border-slate-300'
                        : rank === 3
                        ? 'bg-[#fed7aa] text-[#c2411d] border border-[#fdba74]'
                        : 'text-slate-400 font-mono font-bold'
                    }`}
                  >
                    {rank}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{e.user?.full_name || e.user?.username || 'Contestant'}</span>
                      {isMe && <span className="text-[10px] text-[#e05a38] font-bold">(You)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {e.total_correct} correct • {formatTimeMs(e.total_time_taken_ms)} speed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-[#e05a38] font-mono">{e.score} pts</span>
                  {e.qualified_for_next_round && (
                    <span className="px-3 py-1 rounded-xl bg-[#dcfce7] text-[#15803d] text-[10px] font-bold">
                      Qualified
                    </span>
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
    <Suspense fallback={<div className="max-w-xl mx-auto py-20 text-center text-slate-400 text-xs">Loading Results...</div>}>
      <QuizResultsContent />
    </Suspense>
  );
}

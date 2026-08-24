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
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatTimeMs, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { AnswerReviewItem, Entry } from '@/lib/types';

function QuizResultsContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const quizId = params.quizId as string;
  const entryId = searchParams.get('entryId');

  const { quizzes, rounds, questions, entries, currentUser, isLoading } = useQuizPlatform();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  const quiz = quizzes.find((q) => q.id === quizId) || directQuiz;
  const entry = entries.find((e) => e.id === entryId) || entries[0];
  const round = entry?.round_id ? rounds.find((r) => r.id === entry.round_id) : null;
  const nextRound = round
    ? rounds.find((r) => r.quiz_id === quizId && r.round_number === round.round_number + 1)
    : null;

  // Retrieve cached or computed answers breakdown
  const [breakdown, setBreakdown] = useState<AnswerReviewItem[]>([]);

  useEffect(() => {
    if (!entry) return;
    if (entry.answers_breakdown && entry.answers_breakdown.length > 0) {
      setBreakdown(entry.answers_breakdown);
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`quizee_breakdown_${entry.id}`);
        if (saved) {
          setBreakdown(JSON.parse(saved));
          return;
        }
      }
    } catch (e) {}

    // Fallback: construct from questions list
    const quizQList = questions.filter((q) => q.quiz_id === quizId);
    if (quizQList.length > 0) {
      const items: AnswerReviewItem[] = quizQList.map((q, idx) => ({
        question_id: q.id,
        question_text: q.question_text,
        order_index: q.order_index || idx + 1,
        points: q.points,
        points_awarded: 0,
        time_taken_ms: 0,
        selected_option_ids: [],
        is_correct: false,
        options: q.options,
        explanation: q.explanation,
      }));
      setBreakdown(items);
    }
  }, [entry?.id, questions.length, quizId]);

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
    const slugPath = quiz?.slug || (quiz?.title ? quiz.title.toLowerCase().replace(/[^a-z0-9]/g, '') : null) || quizId;
    const inviteUrl = currentUser?.referral_code
      ? `${window.location.origin}/${slugPath}?ref=${currentUser.referral_code}`
      : `${window.location.origin}/${slugPath}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Calculating Live Results & Rankings...</p>
      </div>
    );
  }

  if (!quiz || !entry) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Results Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">Results for this attempt are unavailable or have expired.</p>
        <Link href="/explore" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] text-white text-xs font-bold hover:bg-[#c84a29] transition shadow-sm mt-2">
          Back to Explore
        </Link>
      </div>
    );
  }

  // Calculate leaderboard for this round (Deduplicated so each participant has max 1 row)
  const userRoundEntriesMap = new Map<string, Entry>();
  entries
    .filter((e) => e.quiz_id === quizId && (round ? e.round_id === round.id : true) && (e.status === 'submitted' || e.status === 'flagged_for_cheating'))
    .forEach((e) => {
      const existing = userRoundEntriesMap.get(e.user_id);
      if (!existing) {
        userRoundEntriesMap.set(e.user_id, e);
      } else {
        if (
          e.id === entry.id ||
          e.score > existing.score ||
          (e.score === existing.score && e.total_time_taken_ms < existing.total_time_taken_ms) ||
          new Date(e.completed_at || 0).getTime() > new Date(existing.completed_at || 0).getTime()
        ) {
          userRoundEntriesMap.set(e.user_id, e);
        }
      }
    });

  const roundEntries = Array.from(userRoundEntriesMap.values())
    .sort((a, b) => b.score - a.score || a.total_time_taken_ms - b.total_time_taken_ms);

  const userRank = roundEntries.findIndex((e) => e.id === entry.id || e.user_id === entry.user_id) + 1;

  // Determine if Retry is permitted by organizer
  const allowTryAgain = quiz.allow_retries === true;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Celebration Header Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#ebdcd1] text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center mx-auto shadow-sm">
          <Trophy className="w-8 h-8 text-[#e05a38]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">
            {entry.status === 'flagged_for_cheating'
              ? '⚠️ Attempt Flagged'
              : entry.qualified_for_next_round
              ? '🎉 Qualification Achieved!'
              : entry.score > 0
              ? 'Quiz Completed!'
              : 'Attempt Submitted'}
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
            {quiz.title} {round ? `• ${round.title}` : ''}
          </p>
        </div>

        {/* Anti-Cheat Proctoring Flag Alert */}
        {entry.status === 'flagged_for_cheating' && (
          <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 max-w-lg mx-auto text-left flex items-start gap-3.5 shadow-sm">
            <AlertCircle className="w-6 h-6 text-rose-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-900">
                ⚠️ Flagged for Proctoring Violations
              </p>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                This attempt was automatically submitted after exceeding allowed window switches or tab blur events ({entry.violations_count || quiz.max_violations || 3} violations logged). Results are flagged for organizer review.
              </p>
            </div>
          </div>
        )}

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
          {/* Try Again (Only if allowed by quiz organizer) */}
          {allowTryAgain && (
            <Link
              href={`/quiz/${quizId}/play`}
              className="px-6 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-bold shadow-lg shadow-[#e05a38]/20 transition flex items-center gap-2"
            >
              <Repeat className="w-3.5 h-3.5" />
              Try Again
            </Link>
          )}

          {/* Show Answers Button */}
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
          >
            {showAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#e05a38]" />}
            <span>{showAnswers ? 'Hide Answers' : 'Show Answer Breakdown'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={copyReferral}
            className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold shadow-sm transition flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5 text-[#e05a38]" />
            {copiedLink ? 'Link Copied!' : 'Share Competition'}
          </button>
        </div>
      </div>

      {/* --- SHOW ANSWERS BREAKDOWN ACCORDION --- */}
      {showAnswers && (
        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#e05a38]" />
                Questions & Answer Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your responses, correct answers, and detailed explanations.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
              {entry.total_correct} / {breakdown.length || questions.length} Correct
            </span>
          </div>

          <div className="space-y-6">
            {(breakdown.length > 0 ? breakdown : questions.filter((q) => q.quiz_id === quizId)).map((item: any, idx) => {
              const selectedIds: string[] = item.selected_option_ids || [];
              const isCorrect: boolean = item.is_correct;
              const optionsList = item.options || [];

              return (
                <div
                  key={item.question_id || item.id || idx}
                  className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold">
                          Question #{idx + 1}
                        </span>
                        {item.time_taken_ms > 0 && (
                          <span className="text-[11px] text-slate-500 font-bold">
                            ⏱ {formatTimeMs(item.time_taken_ms)}
                          </span>
                        )}
                        {item.points_awarded !== undefined && (
                          <span className={`text-[11px] font-bold ${isCorrect ? 'text-[#15803d]' : 'text-slate-400'}`}>
                            +{item.points_awarded} pts
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-relaxed">
                        {item.question_text}
                      </h3>
                    </div>

                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isCorrect
                          ? 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                          : 'bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]'
                      }`}
                    >
                      {isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                    </span>
                  </div>

                  {/* Options List with Selection & Correct Answers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {optionsList.map((opt: any, optIdx: number) => {
                      const isSelected = selectedIds.includes(opt.id);
                      const isCorrectOption = opt.is_correct === true;
                      const letter = String.fromCharCode(65 + optIdx);

                      let style = 'bg-white border-slate-200 text-slate-700';
                      let iconBadge = null;

                      if (isSelected && isCorrectOption) {
                        style = 'bg-[#dcfce7] border-2 border-[#10b981] text-[#15803d] font-bold';
                        iconBadge = (
                          <span className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        );
                      } else if (isSelected && !isCorrectOption) {
                        style = 'bg-[#fee2e2] border-2 border-[#ef4444] text-[#b91c1c] font-bold';
                        iconBadge = (
                          <span className="w-6 h-6 rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        );
                      } else if (!isSelected && isCorrectOption) {
                        style = 'bg-[#f0fdf4] border-2 border-[#10b981] text-[#15803d] font-bold';
                        iconBadge = (
                          <span className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        );
                      }

                      return (
                        <div
                          key={opt.id || optIdx}
                          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2 ${style}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-black/5 flex items-center justify-center font-bold text-[10px]">
                              {letter}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {iconBadge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Note */}
                  {item.explanation && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-0.5">
                      <p className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Explanation:
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-800">{item.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

'use client';

import React, { useState, useEffect } from 'react';
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
  Building2,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const { quizzes, rounds, questions, entries, currentUser, isLoading } = useQuizPlatform();
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  const quiz = quizzes.find((q) => q.id === quizId) || directQuiz;
  const quizRounds = rounds.filter((r) => r.quiz_id === quizId).sort((a, b) => a.round_number - b.round_number);
  const quizQuestions = questions.filter((q) => q.quiz_id === quizId);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareOrInvite = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = currentUser?.referral_code
      ? `${window.location.origin}/quiz/${quiz.id}?ref=${currentUser.referral_code}`
      : `${window.location.origin}/quiz/${quiz.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

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

  if (isLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Loading Competition Details...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Competition Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">The competition link may be invalid or it may have been removed.</p>
        <Link href="/explore" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] text-white text-xs font-bold hover:bg-[#c84a29] transition shadow-sm mt-2">
          Browse Active Competitions
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
      <div className="relative rounded-3xl bg-white border border-[#ebdcd1] p-8 sm:p-10 overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                quiz.quiz_type === 'tournament'
                  ? 'bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]'
                  : 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
              }`}
            >
              {quiz.quiz_type}
            </span>

            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
              {quiz.scoring_strategy === 'time_decay' ? '⚡ Time-Decay Scoring' : '🎯 Fixed Points'}
            </span>

            {quiz.organisation && (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {quiz.organisation.name}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            {quiz.title}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{quiz.description}</p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] text-slate-500 font-bold">Time / Question</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{quiz.time_limit_per_question_sec}s</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] text-slate-500 font-bold">Base Points</p>
              <p className="text-base font-bold text-[#e05a38] mt-0.5">+{quiz.base_points_per_question} pts</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] text-slate-500 font-bold">Option Shuffle</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{quiz.shuffle_options ? 'Enabled' : 'Disabled'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] text-slate-500 font-bold">Referral Bonus</p>
              <p className={`text-base font-bold mt-0.5 ${quiz.enable_referral_bonus ? 'text-[#15803d]' : 'text-slate-500'}`}>
                {quiz.enable_referral_bonus ? `+${quiz.referral_bonus_points} pts` : 'Disabled'}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/quiz/${quiz.id}/play${activeRound ? `?roundId=${activeRound.id}` : ''}`}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-sm shadow-xl shadow-[#e05a38]/25 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              {activeRound ? `Enter Arena: ${activeRound.title}` : 'Enter Competition Arena'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            {quiz.enable_referral_bonus ? (
              <button
                onClick={handleShareOrInvite}
                className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold shadow-sm transition hover:scale-105"
              >
                <Gift className="w-4 h-4 text-[#e05a38]" />
                <span>
                  {copiedLink
                    ? '✓ Invite Link Copied!'
                    : `Invite Friends (+${quiz.referral_bonus_points || 10} pts)`}
                </span>
              </button>
            ) : (
              <button
                onClick={handleShareOrInvite}
                className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl bg-white hover:bg-slate-50 border border-[#ebdcd1] text-slate-700 text-xs font-bold shadow-sm transition hover:scale-105"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>{copiedLink ? '✓ Competition Link Copied!' : 'Share Competition'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Rounds Breakdown (if tournament) */}
      {quiz.quiz_type === 'tournament' && (
        <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tournament Levels & Progression</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Progression mode: <strong className="text-slate-800 uppercase">{quiz.progression_mode}</strong>
              </p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-[#f5f3ff] border border-[#ddd6fe] text-[#7c3aed] text-xs font-bold">
              {quizRounds.length} Rounds Scheduled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizRounds.map((round) => (
              <div
                key={round.id}
                className={`p-6 rounded-2xl border transition space-y-4 ${
                  round.status === 'active'
                    ? 'bg-[#f0fdf4] border-[#bbf7d0] shadow-md'
                    : 'bg-slate-50 border-slate-200 opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15803d] uppercase tracking-wider">
                    Level {round.round_number}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase ${
                      round.status === 'active'
                        ? 'bg-[#dcfce7] text-[#15803d]'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {round.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{round.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Pass criteria: <strong>{round.min_score_to_qualify || 0} min points</strong> &{' '}
                    <strong>{round.min_correct_to_qualify || 0} correct answers</strong>.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500 font-medium">Max Qualifiers: {round.max_qualifiers || 'Unlimited'}</span>
                  {round.status === 'active' && (
                    <Link
                      href={`/quiz/${quiz.id}/play?roundId=${round.id}`}
                      className="inline-flex items-center gap-1 font-bold text-[#e05a38] hover:underline"
                    >
                      Play Round <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

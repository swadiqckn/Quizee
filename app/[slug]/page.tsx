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
import { matchQuizBySlugOrId } from '@/lib/slug';

export default function SlugQuizLandingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { quizzes, rounds, questions, entries, currentUser, isLoading } = useQuizPlatform();
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Match from local cache or slug helper
  const quiz = matchQuizBySlugOrId(quizzes, slug) || directQuiz;
  const quizRounds = quiz ? rounds.filter((r) => r.quiz_id === quiz.id).sort((a, b) => a.round_number - b.round_number) : [];
  const quizQuestions = quiz ? questions.filter((q) => q.quiz_id === quiz.id) : [];
  const existingCompletedEntry = entries.find(
    (e) => e.quiz_id === quiz?.id && (currentUser ? e.user_id === currentUser.id : false) && e.status === 'submitted'
  );
  const disallowRetries = quiz && quiz.allow_retries !== true;

  const handleShareOrInvite = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = currentUser?.referral_code
      ? `${window.location.origin}/${slug}?ref=${currentUser.referral_code}`
      : `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  useEffect(() => {
    if (!quiz && slug) {
      setIsFetchingDirect(true);
      const supabase = createClient();
      const fetchDirect = async () => {
        try {
          // 1. Try direct ID query
          const { data: byId } = await supabase
            .from('quizzes')
            .select('*, organisation:organisations(*)')
            .eq('id', slug)
            .single();

          if (byId) {
            setDirectQuiz(byId);
            return;
          }

          // 2. Try fetching all active quizzes to match by title slugification
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

  if (isLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Loading Competition Portal...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Competition Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">
          The link <code>/{slug}</code> does not match any active competition.
        </p>
        <Link href="/explore" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] text-white text-xs font-bold hover:bg-[#c84a29] transition shadow-sm mt-2">
          Browse Competitions
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
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {quiz.organisation.name}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            {quiz.title}
          </h1>

          {quiz.description && (
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{quiz.description}</p>
          )}

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
            {currentUser && existingCompletedEntry && disallowRetries ? (
              <Link
                href={`/${slug}/results?entryId=${existingCompletedEntry.id}`}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm shadow-xl shadow-[#15803d]/25 transition-all hover:scale-105"
              >
                <Trophy className="w-4 h-4" />
                <span>View Your Results & Answers ({existingCompletedEntry.score} pts)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={`/${slug}/play${activeRound ? `?roundId=${activeRound.id}` : ''}`}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-sm shadow-xl shadow-[#e05a38]/25 transition-all hover:scale-105"
              >
                <Zap className="w-4 h-4" />
                {activeRound ? `Enter Arena: ${activeRound.title}` : 'Enter Competition Arena'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

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
            {quizRounds.map((r) => (
              <div key={r.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#e05a38]">Round {r.round_number}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                      r.status === 'active'
                        ? 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{r.title}</h3>

                <div className="text-xs text-slate-600 space-y-1 pt-1 font-medium">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Starts: {formatDate(r.scheduled_start_time)}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      Cut-off: <strong>{r.min_score_to_qualify} pts</strong> &{' '}
                      <strong>{r.min_correct_to_qualify} correct</strong>
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

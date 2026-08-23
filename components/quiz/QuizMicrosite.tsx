'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Home,
  Award,
  History,
  Check,
  X,
  Eye,
  EyeOff,
  HelpCircle,
  Send,
  MessageCircle,
  Copy,
  Crown,
  Medal,
  Flame,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Quiz, TournamentRound, Question, Entry, Profile, AnswerReviewItem } from '@/lib/types';
import { formatTimeMs, formatDate } from '@/lib/utils';
import { slugify } from '@/lib/slug';

interface QuizMicrositeProps {
  quiz: Quiz;
  slug: string;
  rounds: TournamentRound[];
  questions: Question[];
  entries: Entry[];
  currentUser: Profile | null;
}

export function QuizMicrosite({
  quiz,
  slug,
  rounds,
  questions,
  entries,
  currentUser,
}: QuizMicrositeProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'ranks' | 'referrals' | 'history'>('home');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAnswersAccordion, setShowAnswersAccordion] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const quizRounds = rounds.filter((r) => r.quiz_id === quiz.id).sort((a, b) => a.round_number - b.round_number);
  const activeRound = quiz.quiz_type === 'tournament'
    ? quizRounds.find((r) => r.status === 'active') || quizRounds[0]
    : null;

  // Check existing user entry
  const userEntry = entries.find(
    (e) => e.quiz_id === quiz.id && (currentUser ? e.user_id === currentUser.id : false) && e.status === 'submitted'
  );
  const disallowRetries = quiz.allow_retries !== true;

  // Retrieve cached answers breakdown if available
  const [breakdown, setBreakdown] = useState<AnswerReviewItem[]>([]);

  useEffect(() => {
    if (!userEntry) return;
    if (userEntry.answers_breakdown && userEntry.answers_breakdown.length > 0) {
      setBreakdown(userEntry.answers_breakdown);
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`quizee_breakdown_${userEntry.id}`);
        if (saved) {
          setBreakdown(JSON.parse(saved));
          return;
        }
      }
    } catch (e) {}

    const quizQList = questions.filter((q) => q.quiz_id === quiz.id);
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
  }, [userEntry?.id, questions.length, quiz.id]);

  // Generate shareable URL with referral code
  const shareUrl = typeof window !== 'undefined'
    ? (currentUser?.referral_code
        ? `${window.location.origin}/${slug}?ref=${currentUser.referral_code}`
        : `${window.location.origin}/${slug}`)
    : `https://quizee.com/${slug}`;

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🔥 Join me in the "${quiz.title}" online competition!\n\nTest your knowledge, score on the leaderboard, and win points.\n👉 Play here: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(`🔥 Join the "${quiz.title}" online competition!\n👉 Play here:`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  // Filtered leaderboard entries
  const quizEntries = entries
    .filter((e) => e.quiz_id === quiz.id)
    .sort((a, b) => b.score - a.score || a.total_time_taken_ms - b.total_time_taken_ms);

  const filteredEntries = quizEntries.filter((e) => {
    const name = e.user?.full_name || e.user?.username || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const myRank = userEntry ? quizEntries.findIndex((e) => e.id === userEntry.id) + 1 : null;

  return (
    <div className="min-h-screen bg-[#fffaf5] text-slate-900 pb-28 sm:pb-16 selection:bg-[#e05a38]/20 selection:text-[#e05a38]">
      {/* --- EVENT HERO & BRAND HEADER --- */}
      <div className="relative border-b border-[#ebdcd1] bg-white overflow-hidden">
        {/* Background Image / Pattern */}
        {quiz.banner_url ? (
          <div className="absolute inset-0 h-56 sm:h-72 w-full overflow-hidden opacity-20 pointer-events-none">
            <img
              src={quiz.banner_url}
              alt="Event banner"
              className="w-full h-full object-cover blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white"></div>
          </div>
        ) : (
          <div className="absolute inset-0 h-48 bg-gradient-to-r from-[#ffebe3] via-[#fff5f0] to-[#fef0ea] opacity-50 pointer-events-none"></div>
        )}

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 sm:pt-12 sm:pb-8 space-y-6">
          {/* Top Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#e05a38] text-white text-xs font-bold shadow-sm shadow-[#e05a38]/20 uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                Live Arena
              </span>

              <span className="px-3.5 py-1 rounded-full bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe] text-xs font-bold uppercase tracking-wider">
                {quiz.quiz_type}
              </span>

              <span className="px-3.5 py-1 rounded-full bg-[#fffbeb] text-[#b45309] border border-[#fde68a] text-xs font-bold">
                {quiz.scoring_strategy === 'time_decay' ? '⚡ Speed Decay' : '🎯 Fixed Points'}
              </span>
            </div>

            {quiz.organisation && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-white border border-[#ebdcd1] text-xs font-bold text-slate-700 shadow-sm">
                <Building2 className="w-3.5 h-3.5 text-[#e05a38]" />
                <span>Hosted by <strong>{quiz.organisation.name}</strong></span>
              </div>
            )}
          </div>

          {/* Event Title & Description */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                {quiz.description}
              </p>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white border border-[#ebdcd1] shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center text-[#e05a38] shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Time / Question</p>
                <p className="text-sm font-bold text-slate-900">{quiz.time_limit_per_question_sec}s</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#ebdcd1] shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center text-[#e05a38] shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Base Points</p>
                <p className="text-sm font-bold text-[#e05a38]">+{quiz.base_points_per_question} pts</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#ebdcd1] shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                <Shuffle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Shuffle Options</p>
                <p className="text-sm font-bold text-slate-900">{quiz.shuffle_options ? 'Active' : 'Standard'}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#ebdcd1] shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Referral Bonus</p>
                <p className={`text-sm font-bold ${quiz.enable_referral_bonus ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {quiz.enable_referral_bonus ? `+${quiz.referral_bonus_points} pts` : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- DESKTOP & TABLET TAB NAVIGATION BAR --- */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#ebdcd1] bg-[#fffcf9]">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'home'
                  ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-[#ebdcd1]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Event Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('ranks')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'ranks'
                  ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-[#ebdcd1]'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Live Ranks & Leaderboard</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                {quizEntries.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'referrals'
                  ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-[#ebdcd1]'
              }`}
            >
              <Gift className="w-4 h-4 text-[#e05a38]" />
              <span>Invite Friends & Rewards</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'history'
                  ? 'bg-[#e05a38] text-white shadow-md shadow-[#e05a38]/20'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-[#ebdcd1]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>My History & Answers</span>
              {userEntry && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA BY TAB --- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================================= */}
        {/* TAB 1: HOME (Event Overview & Action Dock) */}
        {/* ========================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Primary Action Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-[#fff9f6] border-2 border-[#ffd5c4] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#e05a38] uppercase tracking-wider">
                    Ready to Compete?
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {userEntry && disallowRetries
                      ? 'Attempt Completed'
                      : activeRound
                      ? `Arena Open: ${activeRound.title}`
                      : 'Live Competition Arena'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {userEntry && disallowRetries
                      ? `Your attempt was recorded with ${userEntry.score} pts. Single attempt policy active.`
                      : 'Answer swiftly to secure speed-decay points and rank high on the live leaderboard.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {userEntry && disallowRetries ? (
                    <button
                      onClick={() => setActiveTab('history')}
                      className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm shadow-xl shadow-[#15803d]/25 transition hover:scale-105"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>View Results & Answers ({userEntry.score} pts)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link
                      href={`/${slug}/play${activeRound ? `?roundId=${activeRound.id}` : ''}`}
                      className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-sm shadow-xl shadow-[#e05a38]/25 transition hover:scale-105"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Enter Competition Arena</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold transition shadow-sm"
                  >
                    <Share2 className="w-4 h-4 text-[#e05a38]" />
                    <span>{copiedLink ? '✓ Link Copied!' : 'Share Quiz'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Multi-Level Tournament Roadmap (if tournament) */}
            {quiz.quiz_type === 'tournament' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-600" />
                      Tournament Stages & Progression Tree
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mode: <strong className="text-slate-800 uppercase">{quiz.progression_mode} Progression</strong>
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#f5f3ff] text-[#7c3aed] text-xs font-bold border border-[#ddd6fe]">
                    {quizRounds.length} Rounds
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizRounds.map((r) => (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                    >
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

                      <h4 className="text-base font-bold text-slate-900">{r.title}</h4>

                      <div className="text-xs text-slate-600 space-y-1 font-medium pt-1">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Scheduled: {formatDate(r.scheduled_start_time)}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            Cut-off: <strong>{r.min_score_to_qualify} pts</strong> &{' '}
                            <strong>{r.min_correct_to_qualify} correct answers</strong>
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules & Scoring Guide */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#e05a38]" />
                Competition Rules & Scoring Policy
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900">⚡ Dynamic Speed Decay</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Points award maximum when answered immediately. Time taken gradually decays score potential.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900">🛡️ Anti-Cheat Shuffle</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Questions and MCQ options are uniquely randomized per contestant to ensure fair competition.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900">🎁 Viral Referral Bonus</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Invite friends with your unique referral link to earn bonus leaderboard ranking points!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: RANKS (Live Leaderboard & Podium) */}
        {/* ========================================================================= */}
        {activeTab === 'ranks' && (
          <div className="space-y-8">
            {/* Podium for Top 3 */}
            {quizEntries.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-4 pb-2 max-w-2xl mx-auto">
                {/* 2nd Place */}
                <div className="p-4 sm:p-6 rounded-3xl bg-slate-100 border border-slate-300 text-center space-y-2 order-1">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center mx-auto text-sm">
                    #2
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {quizEntries[1]?.user?.full_name || quizEntries[1]?.user?.username || 'Contestant'}
                  </p>
                  <p className="text-sm font-bold text-slate-700 font-mono">{quizEntries[1]?.score} pts</p>
                </div>

                {/* 1st Place Champion */}
                <div className="p-5 sm:p-8 rounded-3xl bg-[#fef3c7] border-2 border-[#fde68a] text-center space-y-2 order-2 -translate-y-4 shadow-lg shadow-amber-500/10">
                  <Crown className="w-8 h-8 text-amber-500 mx-auto" />
                  <div className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 font-bold flex items-center justify-center mx-auto text-base shadow-sm">
                    #1
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {quizEntries[0]?.user?.full_name || quizEntries[0]?.user?.username || 'Champion'}
                  </p>
                  <p className="text-base font-extrabold text-amber-800 font-mono">{quizEntries[0]?.score} pts</p>
                </div>

                {/* 3rd Place */}
                <div className="p-4 sm:p-6 rounded-3xl bg-[#fed7aa] border border-[#fdba74] text-center space-y-2 order-3">
                  <div className="w-10 h-10 rounded-full bg-[#fb923c] text-white font-bold flex items-center justify-center mx-auto text-sm">
                    #3
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {quizEntries[2]?.user?.full_name || quizEntries[2]?.user?.username || 'Contestant'}
                  </p>
                  <p className="text-sm font-bold text-[#c2411d] font-mono">{quizEntries[2]?.score} pts</p>
                </div>
              </div>
            )}

            {/* Leaderboard Table Container */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Live Contestant Standings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Rankings dynamically updated based on speed decay and accuracy.</p>
                </div>

                {/* Search Contestant Input */}
                <input
                  type="text"
                  placeholder="Search contestant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#e05a38] w-full sm:w-60"
                />
              </div>

              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No contestant records match your query.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredEntries.map((e, index) => {
                    const isMe = currentUser ? e.user_id === currentUser.id : false;
                    const rank = quizEntries.findIndex((item) => item.id === e.id) + 1;

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
                            #{rank}
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
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REFERRALS (Viral Invite Hub) */}
        {/* ========================================================================= */}
        {activeTab === 'referrals' && (
          <div className="space-y-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fff0ea] text-[#c2411d] text-xs font-bold">
                  <Gift className="w-3.5 h-3.5" />
                  Invite & Viral Rewards
                </div>
                <h3 className="text-xl font-bold text-slate-900">Share This Quiz with Friends</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Invite your friends and classmates to compete in <strong>{quiz.title}</strong> using your personalized referral link.
                </p>
              </div>

              {/* Shareable Link Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Your Quiz Referral Link</label>
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 focus:outline-none truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Social Sharing Buttons */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">1-Click Quick Share</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleWhatsAppShare}
                    className="py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    onClick={handleTelegramShare}
                    className="py-3.5 px-4 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Share on Telegram</span>
                  </button>
                </div>
              </div>

              {/* User Referral Metrics */}
              {currentUser && (
                <div className="p-4 rounded-2xl bg-[#fff9f6] border border-[#ffd8cb] grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Your Referral Code</p>
                    <p className="text-base font-extrabold text-[#e05a38] font-mono">{currentUser.referral_code}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Total Points Balance</p>
                    <p className="text-base font-extrabold text-[#15803d] font-mono">{currentUser.total_points} pts</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: HISTORY (Entries & Answer Breakdown) */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-8">
            {!userEntry ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#ebdcd1] text-center space-y-4 shadow-sm">
                <History className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">No Attempts Recorded Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You have not submitted an attempt for <strong>{quiz.title}</strong> yet. Join the arena to record your answers and rank!
                </p>
                <Link
                  href={`/${slug}/play${activeRound ? `?roundId=${activeRound.id}` : ''}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-md transition"
                >
                  <Zap className="w-4 h-4" />
                  <span>Start Competition Now</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Previous Attempt Summary Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fdf4] text-[#15803d] text-xs font-bold border border-[#bbf7d0]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Submission Completed
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">Your Competition Results</h3>
                      <p className="text-xs text-slate-500">Submitted on {formatDate(userEntry.completed_at)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-extrabold text-[#e05a38] font-mono">{userEntry.score} pts</span>
                      {myRank && (
                        <span className="px-3.5 py-1.5 rounded-2xl bg-amber-100 text-amber-900 text-xs font-bold">
                          Rank #{myRank}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Boxes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Correct Answers</p>
                      <p className="text-base font-bold text-[#15803d]">{userEntry.total_correct} correct</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Time Speed</p>
                      <p className="text-base font-bold text-slate-900">{formatTimeMs(userEntry.total_time_taken_ms)}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Qualification Status</p>
                      <p className={`text-base font-bold ${userEntry.qualified_for_next_round ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {userEntry.qualified_for_next_round ? '✓ Qualified' : 'Completed'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question-by-Question Review Breakdown */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-[#e05a38]" />
                        Questions & Answers Breakdown
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Inspect your chosen responses alongside the correct answers and explanations.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAnswersAccordion(!showAnswersAccordion)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                    >
                      {showAnswersAccordion ? 'Hide All' : 'Show All'}
                    </button>
                  </div>

                  {showAnswersAccordion && (
                    <div className="space-y-6">
                      {(breakdown.length > 0 ? breakdown : questions.filter((q) => q.quiz_id === quiz.id)).map((item: any, idx) => {
                        const selectedIds: string[] = item.selected_option_ids || [];
                        const isCorrect: boolean = item.is_correct;
                        const optionsList = item.options || [];

                        return (
                          <div
                            key={item.question_id || item.id || idx}
                            className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold">
                                    Q#{idx + 1}
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
                                <h5 className="text-sm font-bold text-slate-900 leading-relaxed">
                                  {item.question_text}
                                </h5>
                              </div>

                              <span
                                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                                  isCorrect
                                    ? 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                                    : 'bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]'
                                }`}
                              >
                                {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                              </span>
                            </div>

                            {/* Options List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {optionsList.map((opt: any, optIdx: number) => {
                                const isSelected = selectedIds.includes(opt.id);
                                const isCorrectOption = opt.is_correct === true;
                                const letter = String.fromCharCode(65 + optIdx);

                                let style = 'bg-white border-slate-200 text-slate-700';
                                let badge = null;

                                if (isSelected && isCorrectOption) {
                                  style = 'bg-[#dcfce7] border-[#10b981] text-[#15803d] font-bold';
                                  badge = '✓ Your Answer (Correct)';
                                } else if (isSelected && !isCorrectOption) {
                                  style = 'bg-[#fee2e2] border-[#ef4444] text-[#b91c1c] font-bold';
                                  badge = '✗ Your Answer';
                                } else if (!isSelected && isCorrectOption) {
                                  style = 'bg-[#f0fdf4] border-[#10b981] text-[#15803d] font-bold';
                                  badge = '✓ Correct Option';
                                }

                                return (
                                  <div
                                    key={opt.id || optIdx}
                                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${style}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-black/5 flex items-center justify-center font-bold text-[10px]">
                                        {letter}
                                      </span>
                                      <span>{opt.text}</span>
                                    </div>
                                    {badge && (
                                      <span className="text-[10px] uppercase font-bold shrink-0">
                                        {badge}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Explanation */}
                            {item.explanation && (
                              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-0.5">
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
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* APP-LIKE FIXED BOTTOM NAVIGATION BAR FOR MOBILE */}
      {/* ========================================================================= */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-[#ebdcd1] shadow-2xl py-2 px-3 flex items-center justify-around">
        <button
          onClick={() => {
            setActiveTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'home' ? 'text-[#e05a38]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className={`text-[10px] font-bold ${activeTab === 'home' ? 'text-[#e05a38]' : 'text-slate-500'}`}>
            Home
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ranks');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'ranks' ? 'text-[#e05a38]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className={`text-[10px] font-bold ${activeTab === 'ranks' ? 'text-[#e05a38]' : 'text-slate-500'}`}>
            Ranks
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('referrals');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'referrals' ? 'text-[#e05a38]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Gift className="w-5 h-5" />
          <span className={`text-[10px] font-bold ${activeTab === 'referrals' ? 'text-[#e05a38]' : 'text-slate-500'}`}>
            Referrals
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
            activeTab === 'history' ? 'text-[#e05a38]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-5 h-5" />
          <span className={`text-[10px] font-bold ${activeTab === 'history' ? 'text-[#e05a38]' : 'text-slate-500'}`}>
            History
          </span>
          {userEntry && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>
      </nav>
    </div>
  );
}

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
  HelpCircle,
  Send,
  MessageCircle,
  Copy,
  Crown,
  Flame,
  ChevronLeft,
  Info,
} from 'lucide-react';
import { Quiz, TournamentRound, Question, Entry, Profile, AnswerReviewItem } from '@/lib/types';
import { formatTimeMs, formatDate } from '@/lib/utils';

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
      `🔥 Join me in "${quiz.title}" online competition!\n\nScore on the leaderboard and win rewards.\n👉 Play here: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(`🔥 Join "${quiz.title}" online competition!\n👉 Play here:`);
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
      {/* --- DESKTOP / TABLET TAB HEADER --- */}
      <div className="border-b border-[#ebdcd1] bg-[#fffcf9] sticky top-0 sm:top-16 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeTab !== 'home' && (
              <button
                onClick={() => setActiveTab('home')}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition flex items-center gap-1 text-xs font-bold mr-1"
                title="Back to Home"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </button>
            )}
            <span className="text-xs font-extrabold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
              {quiz.title}
            </span>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'home'
                  ? 'bg-[#e05a38] text-white shadow-sm shadow-[#e05a38]/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('ranks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ranks'
                  ? 'bg-[#e05a38] text-white shadow-sm shadow-[#e05a38]/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'referrals'
                  ? 'bg-[#e05a38] text-white shadow-sm shadow-[#e05a38]/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-[#e05a38]" />
              <span>Referrals</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'history'
                  ? 'bg-[#e05a38] text-white shadow-sm shadow-[#e05a38]/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {userEntry && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB 1 ONLY: TOP HERO BANNER & METRICS --- */}
      {activeTab === 'home' && (
        <div className="relative border-b border-[#ebdcd1] bg-white overflow-hidden">
          {/* Background Image / Pattern */}
          {quiz.banner_url ? (
            <div className="absolute inset-0 h-48 sm:h-64 w-full overflow-hidden opacity-20 pointer-events-none">
              <img
                src={quiz.banner_url}
                alt="Event banner"
                className="w-full h-full object-cover blur-sm scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white"></div>
            </div>
          ) : (
            <div className="absolute inset-0 h-40 bg-gradient-to-r from-[#ffebe3] via-[#fff5f0] to-[#fef0ea] opacity-50 pointer-events-none"></div>
          )}

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
            {/* Top Status Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#e05a38] text-white text-[11px] font-bold shadow-sm shadow-[#e05a38]/20 uppercase tracking-wider">
                  <Flame className="w-3 h-3" />
                  Live Arena
                </span>

                <span className="px-3 py-0.5 rounded-full bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe] text-[11px] font-bold uppercase tracking-wider">
                  {quiz.quiz_type}
                </span>

                <span className="px-3 py-0.5 rounded-full bg-[#fffbeb] text-[#b45309] border border-[#fde68a] text-[11px] font-bold">
                  {quiz.scoring_strategy === 'time_decay' ? '⚡ Speed Decay' : '🎯 Fixed Points'}
                </span>
              </div>

              {quiz.organisation && (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-2xl bg-white border border-[#ebdcd1] text-[11px] font-bold text-slate-700 shadow-sm">
                  <Building2 className="w-3 h-3 text-[#e05a38]" />
                  <span>Hosted by <strong>{quiz.organisation.name}</strong></span>
                </div>
              )}
            </div>

            {/* Event Title & Description */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {quiz.title}
              </h1>
              {quiz.description && (
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                  {quiz.description}
                </p>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white border border-[#ebdcd1] shadow-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center text-[#e05a38] shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Time / Q</p>
                  <p className="text-xs font-bold text-slate-900">{quiz.time_limit_per_question_sec}s</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#ebdcd1] shadow-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center text-[#e05a38] shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Base Points</p>
                  <p className="text-xs font-bold text-[#e05a38]">+{quiz.base_points_per_question} pts</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#ebdcd1] shadow-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                  <Shuffle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Shuffle</p>
                  <p className="text-xs font-bold text-slate-900">{quiz.shuffle_options ? 'Active' : 'Standard'}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#ebdcd1] shadow-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Referral Bonus</p>
                  <p className={`text-xs font-bold ${quiz.enable_referral_bonus ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {quiz.enable_referral_bonus ? `+${quiz.referral_bonus_points} pts` : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ========================================================================= */}
        {/* TAB 1: HOME (Event Overview & Action Dock) */}
        {/* ========================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Primary Action Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-white to-[#fff9f6] border-2 border-[#ffd5c4] shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#e05a38] uppercase tracking-wider">
                    Ready to Compete?
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">
                    {userEntry && disallowRetries
                      ? 'Attempt Completed'
                      : activeRound
                      ? `Arena Open: ${activeRound.title}`
                      : 'Live Competition Arena'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {userEntry && disallowRetries
                      ? `Your score of ${userEntry.score} pts is recorded on the leaderboard.`
                      : 'Answer quickly to secure speed points and climb the rankings.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {userEntry && disallowRetries ? (
                    <button
                      onClick={() => setActiveTab('history')}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs shadow-lg shadow-[#15803d]/25 transition hover:scale-105"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>View Results & Answers ({userEntry.score} pts)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link
                      href={`/${slug}/play${activeRound ? `?roundId=${activeRound.id}` : ''}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/25 transition hover:scale-105"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Enter Arena</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition shadow-sm"
                  >
                    <Share2 className="w-4 h-4 text-[#e05a38]" />
                    <span>{copiedLink ? '✓ Copied' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tournament Progression (if tournament) */}
            {quiz.quiz_type === 'tournament' && (
              <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      Tournament Stages
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f5f3ff] text-[#7c3aed] text-[10px] font-bold border border-[#ddd6fe]">
                    {quizRounds.length} Rounds
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quizRounds.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e05a38]">Round {r.round_number}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            r.status === 'active'
                              ? 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>

                      <p className="text-[11px] text-slate-500 font-medium">
                        Cut-off: <strong>{r.min_score_to_qualify} pts</strong> &{' '}
                        <strong>{r.min_correct_to_qualify} correct</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules Quick Guide */}
            <div className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#e05a38]" />
                Rules & Scoring
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">⚡ Speed Scoring</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Fast accurate answers receive maximum points and break leaderboard ties.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">🛡️ Anti-Cheat</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    MCQ option sequences are shuffled uniquely for each contestant.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">🎁 Invite Rewards</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Share your referral link with friends to earn leaderboard reward points.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: RANKS (Leaderboard Only) */}
        {/* ========================================================================= */}
        {activeTab === 'ranks' && (
          <div className="space-y-6">
            {/* Top 3 Podium Cards */}
            {quizEntries.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-2 pb-1 max-w-lg mx-auto">
                {/* 2nd Place (Left) */}
                <div className="p-3.5 sm:p-5 rounded-3xl bg-slate-100 border border-slate-300 text-center space-y-1.5 order-1 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center mx-auto text-xs shadow-inner">
                    #2
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {quizEntries[1]?.user?.full_name || quizEntries[1]?.user?.username || 'Contestant'}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 font-mono">
                    {quizEntries[1]?.score} pts
                  </p>
                </div>

                {/* 1st Place Champion (Center & Elevated) */}
                <div className="p-4 sm:p-6 rounded-3xl bg-[#fef3c7] border-2 border-[#fde68a] text-center space-y-2 order-2 -translate-y-3 shadow-lg shadow-amber-500/10">
                  <Crown className="w-6 h-6 text-amber-500 mx-auto" />
                  <div className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 font-extrabold flex items-center justify-center mx-auto text-sm shadow-sm">
                    #1
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {quizEntries[0]?.user?.full_name || quizEntries[0]?.user?.username || 'Champion'}
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-amber-800 font-mono">
                    {quizEntries[0]?.score} pts
                  </p>
                </div>

                {/* 3rd Place (Right) */}
                <div className="p-3.5 sm:p-5 rounded-3xl bg-[#fed7aa]/60 border border-[#fdba74] text-center space-y-1.5 order-3 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-[#fb923c] text-white font-extrabold flex items-center justify-center mx-auto text-xs shadow-inner">
                    #3
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {quizEntries[2]?.user?.full_name || quizEntries[2]?.user?.username || 'Contestant'}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-[#c2411d] font-mono">
                    {quizEntries[2]?.score} pts
                  </p>
                </div>
              </div>
            )}

            {/* Leaderboard Table (Rank Number, Name, Points ONLY) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-white border border-[#ebdcd1] shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Leaderboard
                </h3>

                {/* Search Contestant Input */}
                <input
                  type="text"
                  placeholder="Search name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#e05a38] w-40 sm:w-56"
                />
              </div>

              {filteredEntries.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium space-y-2">
                  <Users className="w-7 h-7 text-slate-300 mx-auto" />
                  <p>No contestants recorded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredEntries.map((e, index) => {
                    const isMe = currentUser ? e.user_id === currentUser.id : false;
                    const rank = quizEntries.findIndex((item) => item.id === e.id) + 1;

                    return (
                      <div
                        key={e.id}
                        className={`py-3.5 px-3 rounded-2xl flex items-center justify-between gap-3 transition ${
                          isMe ? 'bg-[#fff0ea] border border-[#ffd8cb]' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Rank Number & Name */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
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
                          </span>

                          <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{e.user?.full_name || e.user?.username || 'Contestant'}</span>
                            {isMe && <span className="text-[10px] text-[#e05a38] font-bold">(You)</span>}
                          </span>
                        </div>

                        {/* Points ONLY */}
                        <span className="text-xs sm:text-sm font-extrabold text-[#e05a38] font-mono shrink-0">
                          {e.score} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REFERRALS (Invite & Rewards) */}
        {/* ========================================================================= */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#ebdcd1] shadow-lg space-y-5">
              <div className="space-y-1 border-b border-slate-100 pb-3.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fff0ea] text-[#c2411d] text-[10px] font-bold">
                  <Gift className="w-3 h-3" />
                  Referral Rewards
                </div>
                <h3 className="text-lg font-bold text-slate-900">Invite Friends & Earn Points</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Share your link with colleagues or classmates to earn bonus points for this competition.
                </p>
              </div>

              {/* Shareable Link Input */}
              <div className="space-y-1.5">
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
                    className="px-3.5 py-2 rounded-xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Social Sharing */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 block">1-Click Share</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleWhatsAppShare}
                    className="py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    onClick={handleTelegramShare}
                    className="py-3 px-4 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Share on Telegram</span>
                  </button>
                </div>
              </div>

              {/* User Referral Metrics */}
              {currentUser && (
                <div className="p-4 rounded-2xl bg-[#fff9f6] border border-[#ffd8cb] grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Your Code</p>
                    <p className="text-sm font-extrabold text-[#e05a38] font-mono">{currentUser.referral_code}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Points Balance</p>
                    <p className="text-sm font-extrabold text-[#15803d] font-mono">{currentUser.total_points} pts</p>
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
          <div className="space-y-6">
            {!userEntry ? (
              <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] text-center space-y-3 shadow-sm">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Attempts Recorded Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You have not submitted an attempt for <strong>{quiz.title}</strong>. Enter the arena to record your score!
                </p>
                <Link
                  href={`/${slug}/play${activeRound ? `?roundId=${activeRound.id}` : ''}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-md transition"
                >
                  <Zap className="w-4 h-4" />
                  <span>Start Quiz Now</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Score Summary Box */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Your Results</h3>
                      <p className="text-[11px] text-slate-500">{formatDate(userEntry.completed_at)}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-extrabold text-[#e05a38] font-mono">{userEntry.score} pts</span>
                      {myRank && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[11px] font-bold">
                          Rank #{myRank}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Correct Answers</p>
                      <p className="text-sm font-bold text-[#15803d]">{userEntry.total_correct} correct</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Time Duration</p>
                      <p className="text-sm font-bold text-slate-900">{formatTimeMs(userEntry.total_time_taken_ms)}</p>
                    </div>
                  </div>
                </div>

                {/* Questions & Answers Breakdown */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-lg space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#e05a38]" />
                      Questions & Answers Breakdown
                    </h4>

                    <button
                      onClick={() => setShowAnswersAccordion(!showAnswersAccordion)}
                      className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200 transition"
                    >
                      {showAnswersAccordion ? 'Hide All' : 'Show All'}
                    </button>
                  </div>

                  {showAnswersAccordion && (
                    <div className="space-y-4">
                      {(breakdown.length > 0 ? breakdown : questions.filter((q) => q.quiz_id === quiz.id)).map((item: any, idx) => {
                        const selectedIds: string[] = item.selected_option_ids || [];
                        const isCorrect: boolean = item.is_correct;
                        const optionsList = item.options || [];

                        return (
                          <div
                            key={item.question_id || item.id || idx}
                            className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold">
                                  Q#{idx + 1}
                                </span>
                                {item.points_awarded !== undefined && (
                                  <span className={`text-[10px] font-bold ${isCorrect ? 'text-[#15803d]' : 'text-slate-400'}`}>
                                    +{item.points_awarded} pts
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                                {item.question_text}
                              </h5>
                            </div>

                            {/* Options List with inline Red/Green styling */}
                            <div className="space-y-2 pt-1">
                              {optionsList.map((opt: any, optIdx: number) => {
                                const isSelected = selectedIds.includes(opt.id);
                                const isCorrectOption = opt.is_correct === true;
                                const letter = String.fromCharCode(65 + optIdx);

                                let containerClass = 'bg-white border-slate-200 text-slate-700';
                                let badgeText = null;

                                if (isSelected && isCorrectOption) {
                                  // Selected and correct -> Bold Green Theme
                                  containerClass = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-bold';
                                  badgeText = '✓ Your Answer (Correct)';
                                } else if (isSelected && !isCorrectOption) {
                                  // Selected and wrong -> Bold Red Theme
                                  containerClass = 'bg-rose-50 border-2 border-rose-500 text-rose-800 font-bold';
                                  badgeText = '✗ Your Answer (Incorrect)';
                                } else if (!isSelected && isCorrectOption) {
                                  // Not selected but is correct -> Green Theme
                                  containerClass = 'bg-emerald-50/70 border-2 border-emerald-400 text-emerald-800 font-bold';
                                  badgeText = '✓ Correct Option';
                                }

                                return (
                                  <div
                                    key={opt.id || optIdx}
                                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 transition ${containerClass}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-black/5 flex items-center justify-center font-bold text-[10px] shrink-0">
                                        {letter}
                                      </span>
                                      <span>{opt.text}</span>
                                    </div>
                                    {badgeText && (
                                      <span className="text-[10px] uppercase font-extrabold tracking-wider shrink-0">
                                        {badgeText}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Explanation */}
                            {item.explanation && (
                              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-0.5">
                                <p className="font-bold flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  Explanation:
                                </p>
                                <p className="leading-relaxed text-amber-800">{item.explanation}</p>
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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Layers,
  Zap,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Shuffle,
  Building2,
  Trophy,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';

export default function ExplorePage() {
  const { quizzes, currentUser, activeOrg } = useQuizPlatform();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'tournament' | 'single'>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<'all' | 'time_decay' | 'fixed'>('all');

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || quiz.quiz_type === selectedType;
    const matchesStrategy = selectedStrategy === 'all' || quiz.scoring_strategy === selectedStrategy;
    return matchesSearch && matchesType && matchesStrategy;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff0ea] border border-[#ffd5c4] text-[#c2411d] text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-[#e05a38]" />
            Live Arena Directory
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Explore Competitions</h1>
          <p className="text-slate-600 text-sm mt-1">
            Discover single-round challenges, speed-decay arenas, and multi-level championships.
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link
              href="/admin/quizzes/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-xs font-bold text-white transition shadow-md shadow-[#e05a38]/20"
            >
              <Sparkles className="w-4 h-4" />
              Create Competition
            </Link>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes by title, topic, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#e05a38]"
          >
            <option value="all">All Formats</option>
            <option value="tournament">Tournaments Only</option>
            <option value="single">Single Quiz Only</option>
          </select>

          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#e05a38]"
          >
            <option value="all">All Scoring</option>
            <option value="time_decay">⚡ Time-Decay Only</option>
            <option value="fixed">🎯 Fixed Points Only</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#ebdcd1] shadow-sm space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">No competitions found</h2>
          <p className="text-xs text-slate-500">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="rounded-3xl bg-white border border-[#ebdcd1] shadow-sm hover:shadow-xl hover:border-[#e05a38]/40 transition overflow-hidden flex flex-col justify-between group"
            >
              <div className="p-6 space-y-4">
                {/* Cover & Badges */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        quiz.quiz_type === 'tournament'
                          ? 'bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]'
                          : 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
                      }`}
                    >
                      {quiz.quiz_type}
                    </span>

                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                      {quiz.scoring_strategy === 'time_decay' ? '⚡ Time-Decay' : '🎯 Fixed Points'}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-[#e05a38] transition leading-tight">
                    {quiz.title}
                  </h2>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{quiz.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#e05a38]" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Timer</p>
                      <p className="font-bold text-slate-800">{quiz.time_limit_per_question_sec}s / q</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <Shuffle className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Shuffle</p>
                      <p className="font-bold text-slate-800">
                        {quiz.shuffle_options ? 'Options' : 'Standard'}
                      </p>
                    </div>
                  </div>
                </div>

                {quiz.enable_referral_bonus && (
                  <div className="px-3.5 py-2 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-[11px] font-bold flex items-center justify-between">
                    <span>Referral Reward</span>
                    <strong>+{quiz.referral_bonus_points} pts</strong>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {quiz.organisation?.name || 'Quizee'}
                </span>
                <Link
                  href={`/quiz/${quiz.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e05a38] hover:text-[#c84a29]"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

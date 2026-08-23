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
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';

export default function ExplorePage() {
  const { quizzes, activeOrg } = useQuizPlatform();
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
          <h1 className="text-3xl font-extrabold text-white">Explore Competitions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Discover single-round challenges, speed-decay arenas, and multi-level championships.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/quizzes/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-md shadow-indigo-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Create Quiz
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search competitions, topics, or tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'tournament', 'single'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  selectedType === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'time_decay', 'fixed'] as const).map((strat) => (
              <button
                key={strat}
                onClick={() => setSelectedStrategy(strat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedStrategy === strat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {strat === 'all' ? 'All Scoring' : strat === 'time_decay' ? 'Time-Decay' : 'Fixed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/60">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Competitions Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between overflow-hidden group shadow-lg"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                      quiz.quiz_type === 'tournament'
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    }`}
                  >
                    {quiz.quiz_type === 'tournament' ? <Layers className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    <span className="capitalize">{quiz.quiz_type}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                    {quiz.scoring_strategy === 'time_decay' ? '⚡ Time-Decay' : '🎯 Fixed'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition leading-snug">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{quiz.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <div>
                      <p className="text-[10px] text-slate-500">Timer</p>
                      <p className="font-semibold text-slate-200">{quiz.time_limit_per_question_sec}s / question</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center gap-2">
                    <Shuffle className="w-3.5 h-3.5 text-pink-400" />
                    <div>
                      <p className="text-[10px] text-slate-500">Shuffle</p>
                      <p className="font-semibold text-slate-200">
                        {quiz.shuffle_options ? 'Options' : 'Standard'}
                      </p>
                    </div>
                  </div>
                </div>

                {quiz.enable_referral_bonus && (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium flex items-center justify-between">
                    <span>Referral Reward</span>
                    <strong>+{quiz.referral_bonus_points} pts</strong>
                  </div>
                )}
              </div>

              <div className="px-6 py-3.5 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {quiz.organisation?.name || 'QuizArena'}
                </span>
                <Link
                  href={`/quiz/${quiz.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
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

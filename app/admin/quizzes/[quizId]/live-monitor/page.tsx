'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  Trophy,
  Award,
  Layers,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Users,
  Clock,
  Zap,
  Sparkles,
  Download,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatTimeMs, formatDate } from '@/lib/utils';

export default function LiveMonitorPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { quizzes, rounds, entries, winners, manuallyQualifyEntry } = useQuizPlatform();

  const quiz = quizzes.find((q) => q.id === quizId);
  const quizRounds = rounds.filter((r) => r.quiz_id === quizId);
  const quizEntries = entries.filter((e) => e.quiz_id === quizId);

  const [selectedRound, setSelectedRound] = useState<string>('all');

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-white">
        <p>Quiz not found.</p>
      </div>
    );
  }

  const filteredEntries = quizEntries.filter((e) => {
    if (selectedRound === 'all') return true;
    return e.round_id === selectedRound;
  }).sort((a, b) => b.score - a.score || a.total_time_taken_ms - b.total_time_taken_ms);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Real-Time Tournament Arena Feed
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Live Submissions & Qualifiers</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/quiz/${quiz.id}`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            Public Arena
          </Link>
        </div>
      </div>

      {/* Round Filter Tabs */}
      {quiz.quiz_type === 'tournament' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedRound('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              selectedRound === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Submissions ({quizEntries.length})
          </button>
          {quizRounds.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRound(r.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                selectedRound === r.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {r.title} ({quizEntries.filter((e) => e.round_id === r.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Entries List */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Participant Leaderboard & Qualification Control
          </h2>
          <span className="text-xs text-slate-400 font-mono">{filteredEntries.length} contestants active</span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-800/60">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No Submissions Recorded Yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Contestant attempts will appear here in real-time as they play.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredEntries.map((entry, index) => {
              const rank = index + 1;
              return (
                <div
                  key={entry.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        rank === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : rank === 2
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                          : rank === 3
                          ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                          : 'bg-slate-950 text-slate-500 font-mono'
                      }`}
                    >
                      #{rank}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white">
                        {entry.user?.full_name || 'Contestant'}
                        <span className="text-xs font-normal text-slate-400 ml-2">({entry.user?.email})</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="text-emerald-400 font-medium">{entry.total_correct} Correct</span>
                        <span>•</span>
                        <span>Speed: {formatTimeMs(entry.total_time_taken_ms)}</span>
                        <span>•</span>
                        <span>Submitted {formatDate(entry.completed_at || entry.started_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Qualification Action */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-base font-black text-indigo-400">{entry.score} pts</p>
                      <p className="text-[10px] text-slate-500">
                        {quiz.scoring_strategy === 'time_decay' ? 'Time-Decayed Score' : 'Fixed Score'}
                      </p>
                    </div>

                    {/* Manual Qualification Toggle */}
                    <button
                      onClick={() => manuallyQualifyEntry(entry.id, !entry.qualified_for_next_round)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        entry.qualified_for_next_round
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {entry.qualified_for_next_round ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Qualified
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Not Qualified
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

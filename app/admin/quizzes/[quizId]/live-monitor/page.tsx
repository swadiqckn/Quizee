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
      <div className="max-w-4xl mx-auto py-20 text-center text-slate-900 font-bold">
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
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-[#15803d] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#15803d] animate-ping"></span>
            <span>Live Contestant Monitor</span>
            <span>•</span>
            <span className="text-slate-900">{quiz.title}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">Live Standings & Qualifier Control</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting entries to CSV...')}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#ebdcd1] text-xs font-bold text-slate-700 shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#e05a38]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Round Filter Tabs */}
      {quiz.quiz_type === 'tournament' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedRound('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              selectedRound === 'all'
                ? 'bg-[#e05a38] text-white shadow-sm'
                : 'bg-white border border-[#ebdcd1] text-slate-700 hover:text-slate-950'
            }`}
          >
            All Tournament Entries ({quizEntries.length})
          </button>
          {quizRounds.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRound(r.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
                selectedRound === r.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-[#ebdcd1] text-slate-700 hover:text-slate-950'
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>
      )}

      {/* Standings Table */}
      <div className="p-8 rounded-3xl bg-white border border-[#ebdcd1] space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900">
            Contestant Submissions & Qualifier Overrides
          </h2>
          <span className="text-xs font-bold text-slate-500">{filteredEntries.length} contestants active</span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">No contestant submissions recorded yet for this round.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEntries.map((e, index) => {
              const rank = index + 1;
              return (
                <div key={e.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        rank === 1
                          ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                          : rank === 2
                          ? 'bg-slate-200 text-slate-700'
                          : rank === 3
                          ? 'bg-[#fed7aa] text-[#c2411d]'
                          : 'text-slate-400 font-mono font-bold'
                      }`}
                    >
                      {rank}
                    </div>

                    <div>
                      <p className="text-xs font-black text-slate-900">
                        {e.user?.full_name || e.user?.username || 'Contestant'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {e.total_correct} correct • {formatTimeMs(e.total_time_taken_ms)} speed • Submitted {formatDate(e.completed_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-black text-[#e05a38] font-mono">{e.score} pts</span>
                      <p className="text-[10px] text-slate-400 font-bold">Points</p>
                    </div>

                    {/* Manual Qualifier Toggle Button */}
                    <button
                      onClick={() => manuallyQualifyEntry(e.id, !e.qualified_for_next_round)}
                      className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 ${
                        e.qualified_for_next_round
                          ? 'bg-[#dcfce7] text-[#15803d] hover:bg-[#bbf7d0]'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {e.qualified_for_next_round ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d]" />
                          Qualified
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          Disqualified
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

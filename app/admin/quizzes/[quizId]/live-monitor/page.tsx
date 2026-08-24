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
  AlertCircle,
  Settings,
  Shield,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatTimeMs, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export default function LiveMonitorPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { quizzes, rounds, entries, winners, manuallyQualifyEntry, currentUser, isLoading } = useQuizPlatform();
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  const quiz = quizzes.find((q) => q.id === quizId) || directQuiz;
  const quizRounds = rounds.filter((r) => r.quiz_id === quizId);
  const quizEntries = entries.filter((e) => e.quiz_id === quizId);

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

  const [selectedRound, setSelectedRound] = useState<string>('all');

  if (isLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Loading Live Contestant Standings...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Competition Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">The competition may have been removed or link is invalid.</p>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-bold transition shadow-sm mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizer Dashboard
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.role === 'superadmin' || !quiz.created_by || quiz.created_by === currentUser?.id;

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600 font-medium">
          You do not have permission to view live standings or manage qualifiers for this competition because it was created by another organizer.
        </p>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-bold transition shadow-sm mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Your Dashboard
        </Link>
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
          <div className="flex items-center gap-2 text-xs font-bold text-[#15803d] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#15803d] animate-ping"></span>
            <span>Live Contestant Monitor</span>
            <span>•</span>
            <span className="text-slate-900">{quiz.title}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">Live Standings & Qualifier Control</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/quizzes/${quiz.id}/edit`}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            Edit Quiz Settings
          </Link>

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
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
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
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
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
          <h2 className="text-base font-bold text-slate-900">
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
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
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
                      <p className="text-xs font-bold text-slate-900">
                        {e.user?.full_name || e.user?.username || 'Contestant'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {e.total_correct} correct • {formatTimeMs(e.total_time_taken_ms)} speed • Submitted {formatDate(e.completed_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#e05a38] font-mono">{e.score} pts</span>
                      <p className="text-[10px] text-slate-400 font-bold">Points</p>
                    </div>

                    {/* Manual Qualifier Toggle Button */}
                    <button
                      onClick={() => manuallyQualifyEntry(e.id, !e.qualified_for_next_round)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
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

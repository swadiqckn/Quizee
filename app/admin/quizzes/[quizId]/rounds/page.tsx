'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatDate } from '@/lib/utils';
import { TournamentRound, RoundStatus } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function ManageTournamentRoundsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { quizzes, rounds, addRound, updateRound, deleteRound, isLoading } = useQuizPlatform();
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  const quiz = quizzes.find((q) => q.id === quizId) || directQuiz;
  const quizRounds = rounds.filter((r) => r.quiz_id === quizId).sort((a, b) => a.round_number - b.round_number);

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

  const [isAdding, setIsAdding] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [scheduledStart, setScheduledStart] = useState(new Date().toISOString().slice(0, 16));
  const [scheduledEnd, setScheduledEnd] = useState(
    new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );
  const [minScore, setMinScore] = useState<number>(10);
  const [minCorrect, setMinCorrect] = useState<number>(1);
  const [maxQualifiers, setMaxQualifiers] = useState<number>(50);
  const [status, setStatus] = useState<RoundStatus>('pending');

  if (isLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Loading Tournament Levels...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Tournament Not Found</h2>
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingRoundId) {
      await updateRound(editingRoundId, {
        title: title.trim(),
        scheduled_start_time: new Date(scheduledStart).toISOString(),
        scheduled_end_time: new Date(scheduledEnd).toISOString(),
        min_score_to_qualify: Number(minScore),
        min_correct_to_qualify: Number(minCorrect),
        max_qualifiers: Number(maxQualifiers),
        status,
      });
      setEditingRoundId(null);
    } else {
      await addRound(quizId, {
        title: title.trim(),
        scheduled_start_time: new Date(scheduledStart).toISOString(),
        scheduled_end_time: new Date(scheduledEnd).toISOString(),
        min_score_to_qualify: Number(minScore),
        min_correct_to_qualify: Number(minCorrect),
        max_qualifiers: Number(maxQualifiers),
        status,
      });
    }

    reset();
  };

  const reset = () => {
    setIsAdding(false);
    setEditingRoundId(null);
    setTitle('');
    setMinScore(10);
    setMinCorrect(1);
    setMaxQualifiers(50);
    setStatus('pending');
  };

  const startEdit = (r: TournamentRound) => {
    setEditingRoundId(r.id);
    setIsAdding(true);
    setTitle(r.title);
    setScheduledStart(new Date(r.scheduled_start_time || Date.now()).toISOString().slice(0, 16));
    setScheduledEnd(new Date(r.scheduled_end_time || Date.now()).toISOString().slice(0, 16));
    setMinScore(r.min_score_to_qualify || 0);
    setMinCorrect(r.min_correct_to_qualify || 0);
    setMaxQualifiers(r.max_qualifiers || 50);
    setStatus(r.status);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizer Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#e05a38] uppercase tracking-wider">
            {quiz.title} • Tournament Bracket
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">
            Tournament Levels & Schedule
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/quizzes/${quiz.id}/edit`}
            className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            Edit Quiz Settings
          </Link>

          {!isAdding && (
            <button
              onClick={() => {
                reset();
                setIsAdding(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition"
            >
              <Plus className="w-4 h-4" />
              Add Tournament Level
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {isAdding && (
        <div className="p-8 rounded-3xl bg-white border-2 border-[#e05a38] space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              {editingRoundId ? 'Edit Tournament Level' : 'Add Tournament Level'}
            </h2>
            <button onClick={reset} className="text-xs font-bold text-slate-500 hover:text-slate-900">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Round / Level Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Round 2: Grand Finals & System Design"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Scheduled Start Time</label>
                <input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Scheduled End / Cutoff</label>
                <input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Min Points to Qualify</label>
                <input
                  type="number"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Min Correct Answers</label>
                <input
                  type="number"
                  value={minCorrect}
                  onChange={(e) => setMinCorrect(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Max Qualifiers Allowed</label>
                <input
                  type="number"
                  value={maxQualifiers}
                  onChange={(e) => setMaxQualifiers(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={reset}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-md shadow-[#e05a38]/20 transition"
              >
                {editingRoundId ? 'Update Level' : 'Save Level'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rounds List */}
      <div className="space-y-4">
        {quizRounds.map((round) => (
          <div
            key={round.id}
            className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-[#fff0ea] text-[#e05a38] font-bold text-xs flex items-center justify-center">
                  L{round.round_number}
                </span>
                <h3 className="text-base font-bold text-slate-900">{round.title}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold uppercase ${
                    round.status === 'active'
                      ? 'bg-[#dcfce7] text-[#15803d]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {round.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                <span>Pass: <strong>{round.min_score_to_qualify} pts</strong> & <strong>{round.min_correct_to_qualify} correct</strong></span>
                <span>•</span>
                <span>Max Qualifiers: <strong>{round.max_qualifiers || 'Unlimited'}</strong></span>
                <span>•</span>
                <span>Starts: {formatDate(round.scheduled_start_time)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(round)}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                title="Edit level"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteRound(round.id)}
                className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                title="Delete level"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

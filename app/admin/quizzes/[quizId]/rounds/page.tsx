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
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { formatDate } from '@/lib/utils';
import { TournamentRound, RoundStatus } from '@/lib/types';

export default function ManageTournamentRoundsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { quizzes, rounds, addRound, updateRound, deleteRound } = useQuizPlatform();

  const quiz = quizzes.find((q) => q.id === quizId);
  const quizRounds = rounds.filter((r) => r.quiz_id === quizId).sort((a, b) => a.round_number - b.round_number);

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

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-white">
        <p>Quiz not found.</p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingRoundId) {
      updateRound(editingRoundId, {
        title: title.trim(),
        scheduled_start_time: new Date(scheduledStart).toISOString(),
        scheduled_end_time: new Date(scheduledEnd).toISOString(),
        min_score_to_qualify: Number(minScore),
        min_correct_to_qualify: Number(minCorrect),
        max_qualifiers: Number(maxQualifiers),
        status,
      });
    } else {
      addRound(quizId, {
        title: title.trim(),
        scheduled_start_time: new Date(scheduledStart).toISOString(),
        scheduled_end_time: new Date(scheduledEnd).toISOString(),
        min_score_to_qualify: Number(minScore),
        min_correct_to_qualify: Number(minCorrect),
        max_qualifiers: Number(maxQualifiers),
        status,
      });
    }

    resetForm();
  };

  const resetForm = () => {
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
    setScheduledStart(r.scheduled_start_time ? new Date(r.scheduled_start_time).toISOString().slice(0, 16) : '');
    setScheduledEnd(r.scheduled_end_time ? new Date(r.scheduled_end_time).toISOString().slice(0, 16) : '');
    setMinScore(r.min_score_to_qualify);
    setMinCorrect(r.min_correct_to_qualify);
    setMaxQualifiers(r.max_qualifiers || 50);
    setStatus(r.status);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
            {quiz.title} • Tournament Bracket
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Tournament Levels & Rounds</h1>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Level / Round
          </button>
        )}
      </div>

      {/* Round Form */}
      {isAdding && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              {editingRoundId ? 'Edit Tournament Level' : 'Add Tournament Level'}
            </h2>
            <button onClick={resetForm} className="text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Round Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Round 3: Semi-Finals"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Round Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RoundStatus)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="pending">Pending (Upcoming)</option>
                  <option value="active">Active (Currently Live)</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Scheduled Start Date/Time</label>
                <input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Scheduled End Date/Time</label>
                <input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Min Score to Qualify
                </label>
                <input
                  type="number"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Min Correct Answers
                </label>
                <input
                  type="number"
                  value={minCorrect}
                  onChange={(e) => setMinCorrect(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Max Advancing Qualifiers
                </label>
                <input
                  type="number"
                  value={maxQualifiers}
                  onChange={(e) => setMaxQualifiers(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20"
              >
                {editingRoundId ? 'Update Level' : 'Save Level'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Rounds List */}
      <div className="space-y-4">
        {quizRounds.map((round) => (
          <div
            key={round.id}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300">
                  Level {round.round_number}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    round.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : round.status === 'completed'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-amber-500/10 text-amber-300'
                  }`}
                >
                  {round.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white">{round.title}</h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Start: {formatDate(round.scheduled_start_time)}
                </span>
                <span>•</span>
                <span className="text-amber-300 font-semibold">
                  Min {round.min_score_to_qualify} pts / {round.min_correct_to_qualify} correct
                </span>
                <span>•</span>
                <span>Max Qualifiers: {round.max_qualifiers || 'Unlimited'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/quizzes/${quiz.id}/questions`}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition"
              >
                Manage Questions
              </Link>
              <button
                onClick={() => startEdit(round)}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {quizRounds.length > 1 && (
                <button
                  onClick={() => deleteRound(round.id)}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-rose-950/40 text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

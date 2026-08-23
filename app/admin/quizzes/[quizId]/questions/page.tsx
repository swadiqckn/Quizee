'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ArrowLeft,
  Image as ImageIcon,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { Question, QuestionOption, AttachmentType } from '@/lib/types';

export default function ManageQuestionsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { quizzes, rounds, questions, addQuestion, updateQuestion, deleteQuestion } = useQuizPlatform();

  const quiz = quizzes.find((q) => q.id === quizId);
  const quizRounds = rounds.filter((r) => r.quiz_id === quizId);
  const quizQuestions = questions.filter((q) => q.quiz_id === quizId);

  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Form State
  const [targetRoundId, setTargetRoundId] = useState<string>(quizRounds[0]?.id || '');
  const [questionText, setQuestionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState<AttachmentType>('image');
  const [points, setPoints] = useState<number>(10);
  const [timeLimitSec, setTimeLimitSec] = useState<number>(15);
  const [explanation, setExplanation] = useState('');

  // Options State
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: 'opt-1', text: '', is_correct: true },
    { id: 'opt-2', text: '', is_correct: false },
    { id: 'opt-3', text: '', is_correct: false },
    { id: 'opt-4', text: '', is_correct: false },
  ]);

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-white">
        <p>Quiz not found.</p>
      </div>
    );
  }

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const handleSetCorrectOption = (id: string) => {
    setOptions((prev) => prev.map((o) => ({ ...o, is_correct: o.id === id })));
  };

  const handleAddOption = () => {
    const newId = `opt-${Date.now()}`;
    setOptions((prev) => [...prev, { id: newId, text: '', is_correct: false }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const validOptions = options.filter((o) => o.text.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please provide at least 2 non-empty options.');
      return;
    }

    if (editingQuestionId) {
      updateQuestion(editingQuestionId, {
        round_id: quiz.quiz_type === 'tournament' ? targetRoundId : null,
        question_text: questionText.trim(),
        attachment_url: attachmentUrl.trim() || null,
        attachment_type: attachmentUrl.trim() ? attachmentType : 'none',
        points: Number(points),
        time_limit_sec: Number(timeLimitSec),
        options: validOptions,
        explanation: explanation.trim() || null,
      });
      setEditingQuestionId(null);
    } else {
      addQuestion({
        quiz_id: quizId,
        round_id: quiz.quiz_type === 'tournament' ? targetRoundId : null,
        question_text: questionText.trim(),
        attachment_url: attachmentUrl.trim() || null,
        attachment_type: attachmentUrl.trim() ? attachmentType : 'none',
        points: Number(points),
        time_limit_sec: Number(timeLimitSec),
        options: validOptions,
        explanation: explanation.trim() || null,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setIsAddingNew(false);
    setEditingQuestionId(null);
    setQuestionText('');
    setAttachmentUrl('');
    setExplanation('');
    setOptions([
      { id: 'opt-1', text: '', is_correct: true },
      { id: 'opt-2', text: '', is_correct: false },
      { id: 'opt-3', text: '', is_correct: false },
      { id: 'opt-4', text: '', is_correct: false },
    ]);
  };

  const startEdit = (q: Question) => {
    setEditingQuestionId(q.id);
    setIsAddingNew(true);
    setQuestionText(q.question_text);
    setTargetRoundId(q.round_id || quizRounds[0]?.id || '');
    setAttachmentUrl(q.attachment_url || '');
    setAttachmentType(q.attachment_type || 'image');
    setPoints(q.points);
    setTimeLimitSec(q.time_limit_sec || 15);
    setExplanation(q.explanation || '');
    setOptions(q.options);
  };

  const filteredQuestions = quizQuestions.filter((q) => {
    if (selectedRoundFilter === 'all') return true;
    return q.round_id === selectedRoundFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizer Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            {quiz.title} • Questions Manager
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Question Bank & Media</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/quiz/${quiz.id}`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Quiz
          </Link>

          {!isAddingNew && (
            <button
              onClick={() => {
                resetForm();
                setIsAddingNew(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          )}
        </div>
      </div>

      {/* Round Filter Tabs if Tournament */}
      {quiz.quiz_type === 'tournament' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedRoundFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              selectedRoundFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Rounds ({quizQuestions.length})
          </button>
          {quizRounds.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoundFilter(r.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                selectedRoundFilter === r.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {r.title} ({quizQuestions.filter((q) => q.round_id === r.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Question Form Modal / Inline Box */}
      {isAddingNew && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-indigo-500/30 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              {editingQuestionId ? 'Edit Question' : 'Add New Question'}
            </h2>
            <button onClick={resetForm} className="text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveQuestion} className="space-y-6">
            {/* Round selection if Tournament */}
            {quiz.quiz_type === 'tournament' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Assign to Tournament Level / Round *
                </label>
                <select
                  value={targetRoundId}
                  onChange={(e) => setTargetRoundId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  {quizRounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Question Text */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Question Prompt *</label>
              <textarea
                rows={3}
                required
                placeholder="Type the question content here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Attachment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Attachment URL (Image / Diagram / Document)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Attachment Type</label>
                <select
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value as AttachmentType)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="image">Image / Diagram</option>
                  <option value="audio">Audio Clip</option>
                  <option value="document">Document / PDF</option>
                </select>
              </div>
            </div>

            {/* Points & Timer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Points Value</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Time Limit (Seconds)</label>
                <input
                  type="number"
                  value={timeLimitSec}
                  onChange={(e) => setTimeLimitSec(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            {/* Options Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Multiple Choice Options (Select Correct Answer)
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Choice
                </button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSetCorrectOption(opt.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        opt.is_correct
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {opt.is_correct ? 'Correct' : 'Mark Correct'}
                    </button>

                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Explanation (Shown on result review)
              </label>
              <textarea
                rows={2}
                placeholder="Explain why the correct answer is right..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Form Actions */}
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
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                {editingQuestionId ? 'Update Question' : 'Save Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No Questions Found</h3>
            <p className="text-xs text-slate-400 mt-1">Click "Add Question" above to add questions with MCQ options.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-4 shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                    Q{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{q.question_text}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>{q.points} pts</span>
                      <span>•</span>
                      <span>{q.time_limit_sec || 15}s limit</span>
                      {q.attachment_url && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-400 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Media Attached
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(q)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-rose-950/40 text-rose-400 text-xs transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {q.options.map((opt, optIdx) => (
                  <div
                    key={opt.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      opt.is_correct
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <span>
                      {String.fromCharCode(65 + optIdx)}. {opt.text}
                    </span>
                    {opt.is_correct && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

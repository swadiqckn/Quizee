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
      <div className="max-w-4xl mx-auto py-20 text-center text-slate-900 font-bold">
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

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const validOptions = options.filter((o) => o.text.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please provide at least 2 non-empty options.');
      return;
    }

    if (editingQuestionId) {
      await updateQuestion(editingQuestionId, {
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
      await addQuestion({
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
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizer Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#e05a38] uppercase tracking-wider">
            {quiz.title} • Questions Manager
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">Question Bank & Media</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/quiz/${quiz.id}`}
            className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-[#ebdcd1] text-xs font-bold text-slate-700 shadow-sm transition flex items-center gap-1.5"
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
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-black text-xs shadow-lg shadow-[#e05a38]/20 transition"
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
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              selectedRoundFilter === 'all'
                ? 'bg-[#e05a38] text-white shadow-sm'
                : 'bg-white border border-[#ebdcd1] text-slate-700 hover:text-slate-950'
            }`}
          >
            All Rounds ({quizQuestions.length})
          </button>
          {quizRounds.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoundFilter(r.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
                selectedRoundFilter === r.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-[#ebdcd1] text-slate-700 hover:text-slate-950'
              }`}
            >
              {r.title} ({quizQuestions.filter((q) => q.round_id === r.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Question Form */}
      {isAddingNew && (
        <div className="p-8 rounded-3xl bg-white border-2 border-[#e05a38] space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e05a38]" />
              {editingQuestionId ? 'Edit Question' : 'Add New Question'}
            </h2>
            <button onClick={resetForm} className="text-xs font-bold text-slate-500 hover:text-slate-900">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveQuestion} className="space-y-6">
            {/* Round selection if Tournament */}
            {quiz.quiz_type === 'tournament' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Assign to Tournament Level / Round *
                </label>
                <select
                  value={targetRoundId}
                  onChange={(e) => setTargetRoundId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
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
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Question Prompt *</label>
              <textarea
                rows={3}
                required
                placeholder="Type the question content here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            {/* Attachment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Attachment URL (Image / Diagram / Document)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Attachment Type</label>
                <select
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
                >
                  <option value="image">Image / Diagram</option>
                  <option value="audio">Audio Clip</option>
                  <option value="document">PDF / Document</option>
                  <option value="none">No Attachment</option>
                </select>
              </div>
            </div>

            {/* Points & Timer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Base Points</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Time Limit (Seconds)</label>
                <input
                  type="number"
                  value={timeLimitSec}
                  onChange={(e) => setTimeLimitSec(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#e05a38]"
                />
              </div>
            </div>

            {/* MCQ Options List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Options & Correct Answer Selection
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-black text-[#e05a38] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div key={opt.id} className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(opt.id)}
                        className={`w-9 h-9 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 transition ${
                          opt.is_correct
                            ? 'bg-[#15803d] text-white shadow-md'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title={opt.is_correct ? 'Correct Option' : 'Click to set as correct'}
                      >
                        {letter}
                      </button>

                      <input
                        type="text"
                        placeholder={`Option ${letter} text...`}
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                        className={`flex-1 px-4 py-2.5 rounded-2xl border text-xs text-slate-900 focus:outline-none ${
                          opt.is_correct
                            ? 'bg-[#f0fdf4] border-[#bbf7d0]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Explanation (Shown on result breakdown)
              </label>
              <textarea
                rows={2}
                placeholder="Explain why this answer is correct..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-black text-xs shadow-lg shadow-[#e05a38]/20 transition"
              >
                {editingQuestionId ? 'Update Question' : 'Save Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#ebdcd1] shadow-sm space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h2 className="text-base font-black text-slate-900">No questions found</h2>
            <p className="text-xs text-slate-500 font-medium">Click "Add Question" above to populate your quiz.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="p-6 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm space-y-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-xl bg-[#fff0ea] text-[#e05a38] text-xs font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-black text-slate-900">{q.points} Points</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-bold">{q.time_limit_sec}s timer</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-relaxed">{q.question_text}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(q)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                    title="Edit question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-2xl text-xs flex items-center justify-between font-bold ${
                      opt.is_correct
                        ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]'
                        : 'bg-slate-50 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />}
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

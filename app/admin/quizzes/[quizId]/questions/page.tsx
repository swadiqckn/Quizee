'use client';

import React, { useState, useRef } from 'react';
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
  Upload,
  Copy,
  Download,
  FileSpreadsheet,
  Check,
  X,
  FileText,
  Settings,
} from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { Question, QuestionOption, AttachmentType } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

// Sample CSV Template content
const CSV_TEMPLATE_CONTENT = `question_text,option_a,option_b,option_c,option_d,correct_option,points,time_limit_sec,explanation
"What is the capital of France?","Paris","London","Berlin","Madrid","A",10,15,"Paris is the capital and largest city of France."
"Which protocol operates at the Transport Layer?","TCP","HTTP","IP","DNS","A",10,20,"TCP and UDP operate at Layer 4 (Transport Layer)."
"What is the time complexity of binary search?","O(log n)","O(n)","O(n log n)","O(1)","A",15,15,"Binary search divides the search space in half with each comparison."
"What does SQL stand for?","Structured Query Language","Simple Query List","Standard Quality Logic","Sequential Query Link","A",10,15,"SQL is the standard language for relational databases."`;

export default function ManageQuestionsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { quizzes, rounds, questions, addQuestion, updateQuestion, deleteQuestion, isLoading } = useQuizPlatform();
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  const quiz = quizzes.find((q) => q.id === quizId) || directQuiz;
  const quizRounds = rounds.filter((r) => r.quiz_id === quizId);
  const quizQuestions = questions.filter((q) => q.quiz_id === quizId);

  // Fallback: Query Supabase directly if quiz not found in memory cache
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

  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Bulk Upload State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [bulkRoundId, setBulkRoundId] = useState<string>(quizRounds[0]?.id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (isLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Loading Competition & Question Bank...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Competition Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">
          The competition you are looking for may have been deleted or the link is invalid.
        </p>
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

  // --- CSV Parser Helper (RFC 4180 compliant) ---
  const parseCSVLine = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let token = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          token += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(token.trim());
        token = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(token.trim());
        if (row.some((col) => col.length > 0)) {
          lines.push(row);
        }
        row = [];
        token = '';
      } else {
        token += char;
      }
    }
    if (token || row.length > 0) {
      row.push(token.trim());
      if (row.some((col) => col.length > 0)) {
        lines.push(row);
      }
    }
    return lines;
  };

  const handleParseCsv = (raw: string) => {
    setBulkError(null);
    setBulkSuccess(null);
    try {
      const parsedRows = parseCSVLine(raw.trim());
      if (parsedRows.length < 2) {
        setParsedPreview([]);
        if (raw.trim().length > 0) {
          setBulkError('CSV must include a header row and at least 1 question row.');
        }
        return;
      }

      const headers = parsedRows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      const qIdx = headers.findIndex((h) => h.includes('question'));
      const optAIdx = headers.findIndex((h) => h === 'option_a' || h === 'optiona' || h === 'a');
      const optBIdx = headers.findIndex((h) => h === 'option_b' || h === 'optionb' || h === 'b');
      const optCIdx = headers.findIndex((h) => h === 'option_c' || h === 'optionc' || h === 'c');
      const optDIdx = headers.findIndex((h) => h === 'option_d' || h === 'optiond' || h === 'd');
      const correctIdx = headers.findIndex((h) => h.includes('correct') || h === 'answer');
      const pointsIdx = headers.findIndex((h) => h.includes('point'));
      const timerIdx = headers.findIndex((h) => h.includes('time') || h.includes('limit') || h.includes('sec'));
      const expIdx = headers.findIndex((h) => h.includes('explanation') || h.includes('reason'));

      if (qIdx === -1 || optAIdx === -1 || optBIdx === -1) {
        setBulkError('Required header columns missing. Ensure your CSV has: question_text, option_a, option_b, correct_option');
        setParsedPreview([]);
        return;
      }

      const items: any[] = [];
      for (let i = 1; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        if (row.length === 0 || !row[qIdx]) continue;

        const qText = row[qIdx];
        const optA = row[optAIdx] || '';
        const optB = row[optBIdx] || '';
        const optC = optCIdx !== -1 ? row[optCIdx] || '' : '';
        const optD = optDIdx !== -1 ? row[optDIdx] || '' : '';
        const correctRaw = (correctIdx !== -1 ? row[correctIdx] : 'A').toUpperCase().trim();
        const pts = pointsIdx !== -1 && !isNaN(Number(row[pointsIdx])) ? Number(row[pointsIdx]) : (quiz.base_points_per_question || 10);
        const timer = timerIdx !== -1 && !isNaN(Number(row[timerIdx])) ? Number(row[timerIdx]) : (quiz.time_limit_per_question_sec || 15);
        const expl = expIdx !== -1 ? row[expIdx] || '' : '';

        // Build question options
        const optsList: QuestionOption[] = [];
        if (optA) optsList.push({ id: `opt-a-${i}`, text: optA, is_correct: correctRaw === 'A' || correctRaw === '1' || correctRaw === optA.toUpperCase() });
        if (optB) optsList.push({ id: `opt-b-${i}`, text: optB, is_correct: correctRaw === 'B' || correctRaw === '2' || correctRaw === optB.toUpperCase() });
        if (optC) optsList.push({ id: `opt-c-${i}`, text: optC, is_correct: correctRaw === 'C' || correctRaw === '3' || correctRaw === optC.toUpperCase() });
        if (optD) optsList.push({ id: `opt-d-${i}`, text: optD, is_correct: correctRaw === 'D' || correctRaw === '4' || correctRaw === optD.toUpperCase() });

        // Ensure at least one option is marked correct (default to A)
        if (!optsList.some((o) => o.is_correct) && optsList.length > 0) {
          optsList[0].is_correct = true;
        }

        items.push({
          question_text: qText,
          points: pts,
          time_limit_sec: timer,
          options: optsList,
          explanation: expl || null,
        });
      }

      setParsedPreview(items);
    } catch (e: any) {
      setBulkError(`CSV Parsing error: ${e.message}`);
      setParsedPreview([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      handleParseCsv(text);
    };
    reader.readAsText(file);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(CSV_TEMPLATE_CONTENT);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `quizee_questions_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteBulkUpload = async () => {
    if (parsedPreview.length === 0) return;
    setIsUploading(true);
    setBulkError(null);

    try {
      for (const item of parsedPreview) {
        await addQuestion({
          quiz_id: quizId,
          round_id: quiz.quiz_type === 'tournament' ? bulkRoundId || null : null,
          question_text: item.question_text,
          attachment_url: null,
          attachment_type: 'none',
          points: item.points,
          time_limit_sec: item.time_limit_sec,
          options: item.options,
          explanation: item.explanation,
        });
      }

      setBulkSuccess(`🎉 Successfully uploaded ${parsedPreview.length} questions to your question bank!`);
      setParsedPreview([]);
      setCsvText('');
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkSuccess(null);
      }, 2000);
    } catch (e: any) {
      setBulkError(`Bulk upload error: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Standard Form Handlers
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
          <span className="text-xs font-bold text-[#e05a38] uppercase tracking-wider">
            {quiz.title} • Questions Manager
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">Question Bank & Media</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/quizzes/${quiz.id}/edit`}
            className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            Edit Quiz Settings
          </Link>

          <Link
            href={`/${quiz.slug || quiz.id}`}
            className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-[#ebdcd1] text-xs font-bold text-slate-700 shadow-sm transition flex items-center gap-1.5"
            target="_blank"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Quiz
          </Link>

          {/* Bulk Upload CSV Button */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold shadow-sm transition hover:scale-105"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#e05a38]" />
            Bulk Upload CSV
          </button>

          {!isAddingNew && (
            <button
              onClick={() => {
                resetForm();
                setIsAddingNew(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition hover:scale-105"
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
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
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
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
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

      {/* --- BULK UPLOAD CSV MODAL --- */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8 p-6 sm:p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#fff0ea] border border-[#ffd8cb] flex items-center justify-center text-[#e05a38]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Bulk Upload Questions via CSV</h2>
                  <p className="text-xs text-slate-500 font-medium">Batch upload questions with options, answers & explanations</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setParsedPreview([]);
                  setBulkError(null);
                  setBulkSuccess(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Actions Toolbar */}
            <div className="p-4 rounded-2xl bg-[#fff9f6] border border-[#ffd8cb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#e05a38]" />
                  CSV Format Template
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Columns: <code className="font-mono text-slate-800 font-bold">question_text, option_a, option_b, option_c, option_d, correct_option, points, time_limit_sec, explanation</code>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyTemplate}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#ffd8cb] text-[#c2411d] text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTemplate ? 'Copied CSV!' : 'Copy Format'}</span>
                </button>

                <button
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-[#e05a38] hover:bg-[#c84a29] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV</span>
                </button>
              </div>
            </div>

            {/* If Tournament: Select target round for bulk upload */}
            {quiz.quiz_type === 'tournament' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Target Tournament Level / Round *
                </label>
                <select
                  value={bulkRoundId}
                  onChange={(e) => setBulkRoundId(e.target.value)}
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

            {/* File Drag & Drop Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#e05a38] bg-slate-50 hover:bg-[#fff9f6] transition cursor-pointer text-center space-y-2 group"
            >
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-[#e05a38] mx-auto transition" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click to browse or drop your <span className="text-[#e05a38]">.CSV</span> file here
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Supports CSV UTF-8 with quoted strings</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Or Paste Raw CSV Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Or Paste CSV Text Directly</label>
              <textarea
                rows={4}
                placeholder={`question_text,option_a,option_b,option_c,option_d,correct_option,points,time_limit_sec,explanation\n"Sample Question?","A","B","C","D","A",10,15,"Explanation"`}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  handleParseCsv(e.target.value);
                }}
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e05a38]"
              />
            </div>

            {/* Alerts */}
            {bulkError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            {bulkSuccess && (
              <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bulkSuccess}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedPreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Questions Preview ({parsedPreview.length} items ready to import)
                  </span>
                  <span className="text-[11px] text-[#15803d] font-bold">✓ Validated</span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {parsedPreview.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">
                          #{idx + 1}. {item.question_text}
                        </p>
                        <span className="text-[10px] text-[#e05a38] font-mono font-bold">
                          {item.points} pts • {item.time_limit_sec}s
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {item.options.map((opt: any, oIdx: number) => (
                          <span
                            key={oIdx}
                            className={`px-2 py-0.5 rounded-lg ${
                              opt.is_correct
                                ? 'bg-[#dcfce7] text-[#15803d] font-bold border border-[#bbf7d0]'
                                : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}: {opt.text} {opt.is_correct ? '✓' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setParsedPreview([]);
                  setBulkError(null);
                }}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteBulkUpload}
                disabled={parsedPreview.length === 0 || isUploading}
                className="px-6 py-2.5 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-[#e05a38]/25 transition flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading Batch...' : `Upload ${parsedPreview.length} Questions`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SINGLE QUESTION FORM --- */}
      {isAddingNew && (
        <div className="p-8 rounded-3xl bg-white border-2 border-[#e05a38] space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
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
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Options & Correct Answer Selection
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-bold text-[#e05a38] hover:underline flex items-center gap-1"
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
                        className={`w-9 h-9 rounded-2xl font-bold text-xs flex items-center justify-center shrink-0 transition ${
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
                className="px-6 py-3 rounded-2xl bg-[#e05a38] hover:bg-[#c84a29] text-white font-bold text-xs shadow-lg shadow-[#e05a38]/20 transition"
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
            <h2 className="text-base font-bold text-slate-900">No questions found</h2>
            <p className="text-xs text-slate-500 font-medium">Click "Add Question" or "Bulk Upload CSV" to populate your quiz.</p>
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
                    <span className="w-6 h-6 rounded-xl bg-[#fff0ea] text-[#e05a38] text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{q.points} Points</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-bold">{q.time_limit_sec}s timer</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-relaxed">{q.question_text}</h3>
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

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useQuizPlatform } from '@/lib/context';
import { createClient } from '@/lib/supabase/client';
import { QuizMicrosite } from '@/components/quiz/QuizMicrosite';

export default function QuizDetailPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { quizzes, rounds, questions, entries, currentUser, isLoading } = useQuizPlatform();
  const [directQuiz, setDirectQuiz] = useState<any>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  const quiz = quizzes.find((q) => q.id === quizId) || directQuiz;

  useEffect(() => {
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

  if (isLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#e05a38] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Loading Competition Details...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 p-8 rounded-3xl bg-white border border-[#ebdcd1] shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Competition Not Found</h2>
        <p className="text-xs text-slate-500 font-medium">The competition link may be invalid or it may have been removed.</p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e05a38] text-white text-xs font-bold hover:bg-[#c84a29] transition shadow-sm mt-2"
        >
          Browse Active Competitions
        </Link>
      </div>
    );
  }

  const effectiveSlug = quiz.slug || quiz.id;

  return (
    <QuizMicrosite
      quiz={quiz}
      slug={effectiveSlug}
      rounds={rounds}
      questions={questions}
      entries={entries}
      currentUser={currentUser}
    />
  );
}

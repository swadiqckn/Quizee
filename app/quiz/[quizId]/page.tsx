import { Metadata } from 'next';
import { getQuizServerMetadata } from '@/lib/quiz-metadata';
import { QuizIdLandingClient } from '@/components/quiz/QuizIdLandingClient';

interface QuizIdPageProps {
  params: { quizId: string };
}

export async function generateMetadata({ params }: QuizIdPageProps): Promise<Metadata> {
  return getQuizServerMetadata(params.quizId);
}

export default function QuizDetailPage({ params }: QuizIdPageProps) {
  return <QuizIdLandingClient quizId={params.quizId} />;
}

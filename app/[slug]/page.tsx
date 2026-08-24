import { Metadata } from 'next';
import { getQuizServerMetadata } from '@/lib/quiz-metadata';
import { SlugLandingClient } from '@/components/quiz/SlugLandingClient';

interface SlugPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  return getQuizServerMetadata(params.slug);
}

export default function SlugQuizLandingPage({ params }: SlugPageProps) {
  return <SlugLandingClient slug={params.slug} />;
}

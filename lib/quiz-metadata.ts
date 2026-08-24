import { Metadata } from 'next';
import { createClient } from './supabase/server';
import { matchQuizBySlugOrId } from './slug';

export async function getQuizServerMetadata(identifier: string): Promise<Metadata> {
  if (!identifier) {
    return {
      title: 'Online Competition Arena',
      description: 'Live interactive quiz competition and tournament arena.',
    };
  }

  try {
    const supabase = createClient();

    // 1. Try finding by direct slug match
    let { data: quiz } = await supabase
      .from('quizzes')
      .select('title, description, banner_url, slug, id, organisation:organisations(name)')
      .eq('slug', identifier)
      .maybeSingle();

    // 2. Try finding by direct ID match
    if (!quiz) {
      const { data: byId } = await supabase
        .from('quizzes')
        .select('title, description, banner_url, slug, id, organisation:organisations(name)')
        .eq('id', identifier)
        .maybeSingle();
      if (byId) quiz = byId;
    }

    // 3. Try slug matching against all quizzes
    if (!quiz) {
      const { data: allQuizzes } = await supabase
        .from('quizzes')
        .select('title, description, banner_url, slug, id, organisation:organisations(name)');
      if (allQuizzes && allQuizzes.length > 0) {
        const matched = matchQuizBySlugOrId(allQuizzes as any, identifier);
        if (matched) quiz = matched as any;
      }
    }

    if (quiz) {
      const title = quiz.title || 'Competition Arena';
      const description =
        quiz.description && quiz.description.trim().length > 0
          ? quiz.description
          : `Join ${title} live competition! Answer questions, score points on the leaderboard and win rewards.`;

      // Use quiz banner_url if present, otherwise default to high-res icon
      const imageUrl =
        quiz.banner_url && quiz.banner_url.startsWith('http')
          ? quiz.banner_url
          : undefined;

      const orgName = (quiz as any).organisation?.name || 'Competition Arena';

      return {
        title: `${title} | Competition Arena`,
        description,
        openGraph: {
          title,
          description,
          siteName: orgName,
          type: 'website',
          images: imageUrl
            ? [
                {
                  url: imageUrl,
                  width: 1200,
                  height: 630,
                  alt: title,
                },
              ]
            : undefined,
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: imageUrl ? [imageUrl] : undefined,
        },
      };
    }
  } catch (e) {
    console.error('Error generating quiz server metadata:', e);
  }

  return {
    title: 'Live Quiz Competition',
    description: 'Join the live assessment and quiz tournament arena.',
  };
}

import { Quiz } from './types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric chars
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores into single dash
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
}

export function compactSlugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function matchQuizBySlugOrId(quizzes: Quiz[], identifier: string): Quiz | undefined {
  if (!identifier) return undefined;
  const cleanId = identifier.trim().toLowerCase();
  const compactId = compactSlugify(identifier);

  return quizzes.find((q) => {
    // 1. Direct ID match
    if (q.id.toLowerCase() === cleanId) return true;

    // 2. Direct custom slug match (if defined in metadata or slug field)
    if (q.slug && q.slug.toLowerCase() === cleanId) return true;
    if (q.slug && compactSlugify(q.slug) === compactId) return true;

    // 3. Title slugification match
    const titleSlug = slugify(q.title);
    if (titleSlug === cleanId) return true;

    // 4. Compact title slug match (e.g. "ziyara2026" matches "Ziyara 2026 Quiz" or "Ziyara 2026")
    const titleCompact = compactSlugify(q.title);
    if (titleCompact === compactId) return true;
    if (titleCompact.startsWith(compactId) && compactId.length >= 4) return true;

    return false;
  });
}

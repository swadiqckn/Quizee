import { ScoringStrategy } from './types';

export interface ScoringParams {
  strategy: ScoringStrategy;
  basePoints: number;
  timeLimitSec: number;
  timeTakenMs: number;
  decayElapsedMs?: number; // Separate decay elapsed time (for scheduled_start mode)
  isCorrect: boolean;
  decayMinPoints?: number;
}

/**
 * Determines the authoritative decay start timestamp based on tournament round 
 * versus quiz-level precedence.
 * 
 * Precedence:
 * 1. Current tournament round settings (if decay_start_source === 'scheduled_start')
 * 2. Quiz settings (if decay_start_source === 'scheduled_start')
 * 3. Falls back to null (implying 'question_open' behavior)
 */
export function getDecayStartTimestamp(
  quiz: { decay_start_source?: string | null; start_time?: string | null },
  round?: { decay_start_source?: string | null; scheduled_start_time?: string | null } | null
): number | null {
  if (round?.decay_start_source === 'scheduled_start') {
    return round.scheduled_start_time
      ? new Date(round.scheduled_start_time).getTime()
      : null;
  }

  if (quiz.decay_start_source === 'scheduled_start') {
    return quiz.start_time
      ? new Date(quiz.start_time).getTime()
      : null;
  }

  return null;
}

/**
 * Calculates score for a question response based on strategy (Fixed vs Time Decay)
 * In Time-Decay mode:
 * Max points = basePoints (e.g. 10)
 * As time elapses up to timeLimitSec, points decay proportionally down to decayMinPoints.
 * Example: 10s limit, base 10 points, answered in 6s => points decay down towards minimum.
 *
 * decayElapsedMs: If provided, used for point decay calculation instead of timeTakenMs.
 *                 This enables synchronous decay from scheduled_start time.
 *                 If not provided, falls back to timeTakenMs.
 */
export function calculateQuestionPoints({
  strategy,
  basePoints,
  timeLimitSec,
  timeTakenMs,
  decayElapsedMs,
  isCorrect,
  decayMinPoints = 0,
}: ScoringParams): number {
  if (!isCorrect) return 0;
  if (basePoints <= 0) return 0;

  if (strategy === 'fixed' || timeLimitSec <= 0) {
    return basePoints;
  }

  // Time decay mode
  const effectiveLimit = timeLimitSec;
  // Use decayElapsedMs if provided (scheduled_start mode), otherwise use timeTakenMs (question_open mode)
  const elapsedMs = decayElapsedMs !== undefined ? decayElapsedMs : timeTakenMs;
  const elapsedSec = Math.min(Math.max(0, elapsedMs / 1000), effectiveLimit);

  // Linear time decay calculation bounded by minimum points range
  const minPoints = Math.max(0, Math.min(decayMinPoints, basePoints));
  const pointsRange = basePoints - minPoints;
  const decayFraction = elapsedSec / effectiveLimit;
  
  const calculatedPoints = Math.round(basePoints - (pointsRange * decayFraction));
  return Math.max(minPoints, calculatedPoints);
}

/**
 * Evaluates whether an entry qualifies for the next tournament round
 */
export function evaluateQualification({
  score,
  totalCorrect,
  minScoreToQualify,
  minCorrectToQualify,
}: {
  score: number;
  totalCorrect: number;
  minScoreToQualify?: number | null;
  minCorrectToQualify?: number | null;
}): boolean {
  const meetsScore = minScoreToQualify ? score >= minScoreToQualify : true;
  const meetsCorrect = minCorrectToQualify ? totalCorrect >= minCorrectToQualify : true;
  return meetsScore && meetsCorrect;
}

/**
 * Modern Fisher-Yates array shuffling
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Formats milliseconds to readable string mm:ss.SS
 */
export function formatTimeMs(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1);
  return `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
}
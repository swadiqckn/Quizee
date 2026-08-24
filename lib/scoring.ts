import { ScoringStrategy } from './types';

export interface ScoringParams {
  strategy: ScoringStrategy;
  basePoints: number;
  timeLimitSec: number;
  timeTakenMs: number;
  isCorrect: boolean;
}

/**
 * Calculates score for a question response based on strategy (Fixed vs Time Decay)
 * In Time-Decay mode:
 * Max points = basePoints (e.g. 10)
 * As time elapses up to timeLimitSec, points decay proportionally.
 * Example: 10s limit, base 10 points, answered in 6s => 4 points awarded.
 */
export function calculateQuestionPoints({
  strategy,
  basePoints,
  timeLimitSec,
  timeTakenMs,
  isCorrect,
}: ScoringParams): number {
  if (!isCorrect) return 0;
  if (basePoints <= 0) return 0;

  if (strategy === 'fixed' || timeLimitSec <= 0) {
    return basePoints;
  }

  // Time decay mode
  const effectiveLimit = timeLimitSec;
  const timeTakenSec = Math.min(Math.max(0, timeTakenMs / 1000), effectiveLimit);
  
  // Linear decay formula
  const fractionRemaining = Math.max(0, 1 - timeTakenSec / effectiveLimit);
  const calculatedPoints = Math.round(basePoints * fractionRemaining);

  // Award at least 1 point for a correct answer submitted within limit
  return Math.max(1, calculatedPoints);
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

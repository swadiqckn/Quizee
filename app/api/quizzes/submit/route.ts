import { NextRequest, NextResponse } from 'next/server';
import { calculateQuestionPoints, evaluateQualification } from '@/lib/scoring';
import { ScoringStrategy } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quizId,
      roundId,
      answers,
      scoringStrategy,
      basePoints,
      timeLimitSec,
      qualificationCriteria,
      status,
      violationsCount,
    } = body;

    let totalScore = 0;
    let totalCorrect = 0;
    let totalTimeTakenMs = 0;

    // Process each answer server-side
    const evaluatedAnswers = (answers || []).map((ans: any) => {
      totalTimeTakenMs += ans.timeTakenMs || 0;
      const isCorrect = Boolean(ans.isCorrect);

      if (isCorrect) {
        totalCorrect += 1;
        const pts = calculateQuestionPoints({
          strategy: (scoringStrategy || 'fixed') as ScoringStrategy,
          basePoints: basePoints || 10,
          timeLimitSec: timeLimitSec || 15,
          timeTakenMs: ans.timeTakenMs || 0,
          isCorrect: true,
        });
        totalScore += pts;
        return { ...ans, pointsAwarded: pts, isCorrect: true };
      }

      return { ...ans, pointsAwarded: 0, isCorrect: false };
    });

    const isFlagged = status === 'flagged_for_cheating';
    const isQualified = isFlagged
      ? false
      : evaluateQualification({
          score: totalScore,
          totalCorrect,
          minScoreToQualify: qualificationCriteria?.minScore,
          minCorrectToQualify: qualificationCriteria?.minCorrect,
        });

    return NextResponse.json({
      success: true,
      score: totalScore,
      totalCorrect,
      totalTimeTakenMs,
      qualifiedForNextRound: isQualified,
      status: status || 'submitted',
      violationsCount: violationsCount || 0,
      evaluatedAnswers,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

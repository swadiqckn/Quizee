'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Organisation,
  Profile,
  Quiz,
  TournamentRound,
  Question,
  Entry,
  Winner,
  Referral,
  ScoringStrategy,
  PlanType,
  PLAN_CONFIG,
} from './types';
import {
  MOCK_ORGS,
  MOCK_USERS,
  MOCK_QUIZZES,
  MOCK_ROUNDS,
  MOCK_QUESTIONS,
  MOCK_ENTRIES,
  MOCK_WINNERS,
  MOCK_REFERRALS,
} from './mock-data';
import { calculateQuestionPoints, evaluateQualification } from './scoring';

interface QuizPlatformContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  switchUserRole: (role: 'superadmin' | 'admin' | 'participant') => void;
  allUsers: Profile[];
  organisations: Organisation[];
  activeOrg: Organisation | null;
  setActiveOrg: (org: Organisation | null) => void;
  quizzes: Quiz[];
  rounds: TournamentRound[];
  questions: Question[];
  entries: Entry[];
  winners: Winner[];
  referrals: Referral[];
  
  // Auth
  login: (username: string, password?: string) => { success: boolean; message?: string; user?: Profile };
  loginWithGoogle: (role?: 'admin' | 'superadmin') => { success: boolean; user: Profile };
  register: (params: {
    username: string;
    password?: string;
    fullName?: string;
    referralCode?: string;
    role?: 'superadmin' | 'admin' | 'participant';
    orgId?: string;
  }) => { success: boolean; message?: string; user?: Profile };
  logout: () => void;

  // Subscription / Plan Actions
  upgradeActiveOrgPlan: (newPlan: PlanType) => void;
  canCreateQuiz: () => { allowed: boolean; reason?: string; currentCount: number; maxAllowed: number | 'unlimited' };

  // Quiz Actions
  createQuiz: (quiz: Partial<Quiz>) => { success: boolean; quiz?: Quiz; error?: string };
  updateQuiz: (id: string, updates: Partial<Quiz>) => void;
  deleteQuiz: (id: string) => void;
  
  // Round Actions
  addRound: (quizId: string, round: Partial<TournamentRound>) => TournamentRound;
  updateRound: (roundId: string, updates: Partial<TournamentRound>) => void;
  deleteRound: (roundId: string) => void;
  
  // Question Actions
  addQuestion: (question: Partial<Question>) => Question;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  deleteQuestion: (questionId: string) => void;
  
  // Arena & Progression Actions
  submitQuizAttempt: (params: {
    quizId: string;
    roundId: string | null;
    answers: Array<{
      questionId: string;
      selectedOptionIds: string[];
      timeTakenMs: number;
    }>;
  }) => { entry: Entry; score: number; qualified: boolean; totalCorrect: number };
  
  manuallyQualifyEntry: (entryId: string, qualified: boolean) => void;
  applyReferralCode: (code: string) => boolean;
}

const QuizPlatformContext = createContext<QuizPlatformContextType | undefined>(undefined);

export function QuizPlatformProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile>(MOCK_USERS[2]); // Default: alexchen (Participant)
  const [allUsers, setAllUsers] = useState<Profile[]>(MOCK_USERS);
  const [organisations, setOrganisations] = useState<Organisation[]>(MOCK_ORGS);
  const [activeOrg, setActiveOrg] = useState<Organisation | null>(MOCK_ORGS[0]);
  const [quizzes, setQuizzes] = useState<Quiz[]>(MOCK_QUIZZES);
  const [rounds, setRounds] = useState<TournamentRound[]>(MOCK_ROUNDS);
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
  const [entries, setEntries] = useState<Entry[]>(MOCK_ENTRIES);
  const [winners, setWinners] = useState<Winner[]>(MOCK_WINNERS);
  const [referrals, setReferrals] = useState<Referral[]>(MOCK_REFERRALS);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('quiz_current_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {}
  }, []);

  const login = (username: string, _password?: string) => {
    const cleanUsername = username.trim().toLowerCase();
    const existing = allUsers.find((u) => u.username?.toLowerCase() === cleanUsername);

    if (!existing) {
      return register({ username: cleanUsername });
    }

    setCurrentUser(existing);
    try {
      localStorage.setItem('quiz_current_user', JSON.stringify(existing));
    } catch (e) {}

    return { success: true, user: existing };
  };

  const loginWithGoogle = (role: 'admin' | 'superadmin' = 'admin') => {
    const googleUser: Profile = role === 'superadmin' ? MOCK_USERS[0] : MOCK_USERS[1];
    setCurrentUser(googleUser);
    try {
      localStorage.setItem('quiz_current_user', JSON.stringify(googleUser));
    } catch (e) {}
    return { success: true, user: googleUser };
  };

  const register = ({
    username,
    _password,
    fullName,
    referralCode,
    role = 'participant',
    orgId,
  }: {
    username: string;
    _password?: string;
    fullName?: string;
    referralCode?: string;
    role?: 'superadmin' | 'admin' | 'participant';
    orgId?: string;
  }) => {
    const cleanUsername = username.trim().toLowerCase();
    const existing = allUsers.find((u) => u.username?.toLowerCase() === cleanUsername);

    if (existing) {
      setCurrentUser(existing);
      return { success: true, user: existing };
    }

    const newRefCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    let referrer: Profile | undefined;
    if (referralCode) {
      referrer = allUsers.find((u) => u.referral_code.toUpperCase() === referralCode.trim().toUpperCase());
    }

    const newUser: Profile = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      email: `${cleanUsername}@quizarena.local`,
      full_name: fullName || cleanUsername,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&auto=format&fit=crop&q=80`,
      role: role,
      auth_provider: 'credentials',
      org_id: orgId || activeOrg?.id || 'org-1',
      referral_code: newRefCode,
      referred_by: referrer ? referrer.id : null,
      total_points: referrer ? 10 : 0,
      total_referrals: 0,
      created_at: new Date().toISOString(),
    };

    setAllUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);

    if (referrer) {
      const newReferral: Referral = {
        id: `ref-${Date.now()}`,
        referrer_id: referrer.id,
        referee_id: newUser.id,
        quiz_id: null,
        bonus_points_awarded: 25,
        created_at: new Date().toISOString(),
        referee: newUser,
        referrer: referrer,
      };
      setReferrals((prev) => [newReferral, ...prev]);

      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === referrer?.id
            ? { ...u, total_points: u.total_points + 25, total_referrals: u.total_referrals + 1 }
            : u
        )
      );
    }

    try {
      localStorage.setItem('quiz_current_user', JSON.stringify(newUser));
    } catch (e) {}

    return { success: true, user: newUser };
  };

  const logout = () => {
    const defaultGuest = MOCK_USERS[2];
    setCurrentUser(defaultGuest);
    try {
      localStorage.removeItem('quiz_current_user');
    } catch (e) {}
  };

  const switchUserRole = (role: 'superadmin' | 'admin' | 'participant') => {
    const targetUser = allUsers.find((u) => u.role === role) || MOCK_USERS.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      try {
        localStorage.setItem('quiz_current_user', JSON.stringify(targetUser));
      } catch (e) {}
    }
  };

  const upgradeActiveOrgPlan = (newPlan: PlanType) => {
    if (!activeOrg) return;
    const updatedOrg = { ...activeOrg, plan: newPlan };
    setActiveOrg(updatedOrg);
    setOrganisations((prev) => prev.map((o) => (o.id === activeOrg.id ? updatedOrg : o)));
  };

  const canCreateQuiz = () => {
    const currentPlan: PlanType = activeOrg?.plan || 'free';
    const currentCount = activeOrg?.quizzes_created_this_month || 0;
    const maxAllowed = PLAN_CONFIG[currentPlan].maxQuizzesPerMonth;

    if (maxAllowed !== 'unlimited' && currentCount >= maxAllowed) {
      return {
        allowed: false,
        reason: `You have reached the Free Plan limit of ${maxAllowed} quizzes this month. Upgrade to Plus Plan for unlimited quizzes.`,
        currentCount,
        maxAllowed,
      };
    }

    return { allowed: true, currentCount, maxAllowed };
  };

  const createQuiz = (quizData: Partial<Quiz>): { success: boolean; quiz?: Quiz; error?: string } => {
    const check = canCreateQuiz();
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const currentPlan: PlanType = activeOrg?.plan || 'free';
    const participantCap = currentPlan === 'free' ? 100 : null; // Free: max 100 participants

    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      org_id: activeOrg?.id || 'org-1',
      title: quizData.title || 'Untitled Quiz',
      description: quizData.description || '',
      banner_url: quizData.banner_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
      quiz_type: quizData.quiz_type || 'single',
      progression_mode: quizData.progression_mode || 'manual',
      scoring_strategy: quizData.scoring_strategy || 'fixed',
      base_points_per_question: quizData.base_points_per_question ?? 10,
      time_limit_per_question_sec: quizData.time_limit_per_question_sec ?? 15,
      total_time_limit_sec: quizData.total_time_limit_sec ?? null,
      shuffle_questions: quizData.shuffle_questions ?? false,
      shuffle_options: quizData.shuffle_options ?? true,
      enable_referral_bonus: quizData.enable_referral_bonus ?? false,
      referral_bonus_points: quizData.referral_bonus_points ?? 10,
      status: quizData.status || 'published',
      max_participants: participantCap,
      start_time: quizData.start_time || new Date().toISOString(),
      end_time: quizData.end_time || new Date(Date.now() + 48 * 3600000).toISOString(),
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      organisation: activeOrg || undefined,
      questions_count: 0,
    };

    setQuizzes((prev) => [newQuiz, ...prev]);

    // Increment monthly count on activeOrg
    if (activeOrg) {
      const updatedOrg = {
        ...activeOrg,
        quizzes_created_this_month: (activeOrg.quizzes_created_this_month || 0) + 1,
      };
      setActiveOrg(updatedOrg);
      setOrganisations((prev) => prev.map((o) => (o.id === activeOrg.id ? updatedOrg : o)));
    }

    return { success: true, quiz: newQuiz };
  };

  const updateQuiz = (id: string, updates: Partial<Quiz>) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates, updated_at: new Date().toISOString() } : q))
    );
  };

  const deleteQuiz = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  };

  const addRound = (quizId: string, roundData: Partial<TournamentRound>): TournamentRound => {
    const existingForQuiz = rounds.filter((r) => r.quiz_id === quizId);
    const newRound: TournamentRound = {
      id: `round-${Date.now()}`,
      quiz_id: quizId,
      round_number: existingForQuiz.length + 1,
      title: roundData.title || `Round ${existingForQuiz.length + 1}`,
      scheduled_start_time: roundData.scheduled_start_time || new Date().toISOString(),
      scheduled_end_time: roundData.scheduled_end_time || new Date(Date.now() + 24 * 3600000).toISOString(),
      min_score_to_qualify: roundData.min_score_to_qualify ?? 10,
      min_correct_to_qualify: roundData.min_correct_to_qualify ?? 1,
      max_qualifiers: roundData.max_qualifiers ?? 20,
      status: roundData.status || 'pending',
      created_at: new Date().toISOString(),
    };

    setRounds((prev) => [...prev, newRound]);
    return newRound;
  };

  const updateRound = (roundId: string, updates: Partial<TournamentRound>) => {
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
  };

  const deleteRound = (roundId: string) => {
    setRounds((prev) => prev.filter((r) => r.id !== roundId));
  };

  const addQuestion = (qData: Partial<Question>): Question => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      quiz_id: qData.quiz_id!,
      round_id: qData.round_id || null,
      order_index: (questions.filter((q) => q.quiz_id === qData.quiz_id).length + 1),
      question_text: qData.question_text || 'New Question',
      attachment_url: qData.attachment_url || null,
      attachment_type: qData.attachment_type || 'none',
      points: qData.points ?? 10,
      time_limit_sec: qData.time_limit_sec ?? 15,
      options: qData.options || [
        { id: 'opt-1', text: 'Option A', is_correct: true },
        { id: 'opt-2', text: 'Option B', is_correct: false },
      ],
      explanation: qData.explanation || null,
      created_at: new Date().toISOString(),
    };

    setQuestions((prev) => [...prev, newQ]);
    
    setQuizzes((prev) =>
      prev.map((qz) =>
        qz.id === qData.quiz_id ? { ...qz, questions_count: (qz.questions_count || 0) + 1 } : qz
      )
    );

    return newQ;
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...updates, updated_at: new Date().toISOString() } : q))
    );
  };

  const deleteQuestion = (questionId: string) => {
    const target = questions.find((q) => q.id === questionId);
    if (!target) return;
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setQuizzes((prev) =>
      prev.map((qz) =>
        qz.id === target.quiz_id ? { ...qz, questions_count: Math.max(0, (qz.questions_count || 1) - 1) } : qz
      )
    );
  };

  const submitQuizAttempt = ({
    quizId,
    roundId,
    answers,
  }: {
    quizId: string;
    roundId: string | null;
    answers: Array<{ questionId: string; selectedOptionIds: string[]; timeTakenMs: number }>;
  }) => {
    const targetQuiz = quizzes.find((q) => q.id === quizId);
    const targetRound = rounds.find((r) => r.id === roundId);
    const strategy: ScoringStrategy = targetQuiz?.scoring_strategy || 'fixed';

    let calculatedScore = 0;
    let totalCorrectCount = 0;
    let totalTimeTaken = 0;

    answers.forEach((ans) => {
      totalTimeTaken += ans.timeTakenMs;
      const question = questions.find((q) => q.id === ans.questionId);
      if (!question) return;

      const correctOptionIds = question.options.filter((o) => o.is_correct).map((o) => o.id);
      const isCorrect =
        correctOptionIds.length > 0 &&
        correctOptionIds.length === ans.selectedOptionIds.length &&
        correctOptionIds.every((id) => ans.selectedOptionIds.includes(id));

      if (isCorrect) {
        totalCorrectCount += 1;
        const pts = calculateQuestionPoints({
          strategy,
          basePoints: question.points,
          timeLimitSec: question.time_limit_sec || targetQuiz?.time_limit_per_question_sec || 15,
          timeTakenMs: ans.timeTakenMs,
          isCorrect: true,
        });
        calculatedScore += pts;
      }
    });

    const isQualified = evaluateQualification({
      score: calculatedScore,
      totalCorrect: totalCorrectCount,
      minScoreToQualify: targetRound?.min_score_to_qualify,
      minCorrectToQualify: targetRound?.min_correct_to_qualify,
    });

    const newEntry: Entry = {
      id: `entry-${Date.now()}`,
      quiz_id: quizId,
      round_id: roundId,
      user_id: currentUser.id,
      score: calculatedScore,
      total_correct: totalCorrectCount,
      total_time_taken_ms: totalTimeTaken,
      qualified_for_next_round: isQualified,
      status: 'submitted',
      started_at: new Date(Date.now() - totalTimeTaken).toISOString(),
      completed_at: new Date().toISOString(),
      user: currentUser,
      quiz: targetQuiz,
      round: targetRound,
    };

    setEntries((prev) => [newEntry, ...prev]);

    setCurrentUser((prev) => ({
      ...prev,
      total_points: prev.total_points + calculatedScore,
    }));

    return {
      entry: newEntry,
      score: calculatedScore,
      qualified: isQualified,
      totalCorrect: totalCorrectCount,
    };
  };

  const manuallyQualifyEntry = (entryId: string, qualified: boolean) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, qualified_for_next_round: qualified } : e))
    );
  };

  const applyReferralCode = (code: string): boolean => {
    const referrer = allUsers.find((u) => u.referral_code.toUpperCase() === code.trim().toUpperCase());
    if (!referrer || referrer.id === currentUser.id) return false;

    const newReferral: Referral = {
      id: `ref-${Date.now()}`,
      referrer_id: referrer.id,
      referee_id: currentUser.id,
      quiz_id: null,
      bonus_points_awarded: 25,
      created_at: new Date().toISOString(),
      referee: currentUser,
      referrer: referrer,
    };

    setReferrals((prev) => [newReferral, ...prev]);
    
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === referrer.id
          ? { ...u, total_points: u.total_points + 25, total_referrals: u.total_referrals + 1 }
          : u.id === currentUser.id
          ? { ...u, referred_by: referrer.id, total_points: u.total_points + 10 }
          : u
      )
    );

    setCurrentUser((prev) => ({
      ...prev,
      referred_by: referrer.id,
      total_points: prev.total_points + 10,
    }));

    return true;
  };

  return (
    <QuizPlatformContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUserRole,
        allUsers,
        organisations,
        activeOrg,
        setActiveOrg,
        quizzes,
        rounds,
        questions,
        entries,
        winners,
        referrals,
        login,
        loginWithGoogle,
        register,
        logout,
        upgradeActiveOrgPlan,
        canCreateQuiz,
        createQuiz,
        updateQuiz,
        deleteQuiz,
        addRound,
        updateRound,
        deleteRound,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        submitQuizAttempt,
        manuallyQualifyEntry,
        applyReferralCode,
      }}
    >
      {children}
    </QuizPlatformContext.Provider>
  );
}

export function useQuizPlatform() {
  const context = useContext(QuizPlatformContext);
  if (!context) {
    throw new Error('useQuizPlatform must be used within a QuizPlatformProvider');
  }
  return context;
}

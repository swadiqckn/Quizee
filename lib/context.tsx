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
import { calculateQuestionPoints, evaluateQualification } from './scoring';
import { createClient } from './supabase/client';

interface QuizPlatformContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
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
  isLoading: boolean;
  
  // Auth
  login: (username: string, password?: string) => Promise<{ success: boolean; message?: string; user?: Profile }>;
  loginWithGoogle: (
    options?:
      | 'admin'
      | 'superadmin'
      | 'participant'
      | { role?: 'admin' | 'superadmin' | 'participant'; referralCode?: string; orgId?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  register: (params: {
    username: string;
    password?: string;
    fullName?: string;
    referralCode?: string;
    role?: 'superadmin' | 'admin' | 'participant';
    orgId?: string;
  }) => Promise<{ success: boolean; message?: string; user?: Profile }>;
  logout: () => Promise<void>;

  // Subscription / Plan Actions
  upgradeActiveOrgPlan: (newPlan: PlanType) => Promise<void>;
  canCreateQuiz: () => { allowed: boolean; reason?: string; currentCount: number; maxAllowed: number | 'unlimited' };

  // Quiz Actions
  createQuiz: (quiz: Partial<Quiz>) => Promise<{ success: boolean; quiz?: Quiz; error?: string }>;
  updateQuiz: (id: string, updates: Partial<Quiz>) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  
  // Round Actions
  addRound: (quizId: string, round: Partial<TournamentRound>) => Promise<TournamentRound>;
  updateRound: (roundId: string, updates: Partial<TournamentRound>) => Promise<void>;
  deleteRound: (roundId: string) => Promise<void>;
  
  // Question Actions
  addQuestion: (question: Partial<Question>) => Promise<Question>;
  updateQuestion: (questionId: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  
  // Arena & Progression Actions
  submitQuizAttempt: (params: {
    quizId: string;
    roundId: string | null;
    answers: Array<{
      questionId: string;
      selectedOptionIds: string[];
      timeTakenMs: number;
    }>;
  }) => Promise<{ entry: Entry; score: number; qualified: boolean; totalCorrect: number }>;
  
  manuallyQualifyEntry: (entryId: string, qualified: boolean) => Promise<void>;
  applyReferralCode: (code: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const QuizPlatformContext = createContext<QuizPlatformContextType | undefined>(undefined);

export function QuizPlatformProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organisation | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUserProfile = async (authUser: any) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (profile) {
        setCurrentUser(profile);
        try {
          localStorage.setItem('quizee_current_user', JSON.stringify(profile));
        } catch (e) {}
      } else {
        const username = authUser.email
          ? authUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
          : `user_${Date.now()}`;
        const newRefCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const newProfile: Profile = {
          id: authUser.id,
          username,
          email: authUser.email,
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            username,
          avatar_url:
            authUser.user_metadata?.avatar_url ||
            authUser.user_metadata?.picture ||
            null,
          role: 'admin',
          auth_provider: 'google',
          google_id: authUser.id,
          org_id: null,
          referral_code: newRefCode,
          referred_by: null,
          total_points: 0,
          total_referrals: 0,
          created_at: new Date().toISOString(),
        };

        await supabase.from('users').upsert(newProfile);
        setCurrentUser(newProfile);
        try {
          localStorage.setItem('quizee_current_user', JSON.stringify(newProfile));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching Supabase user profile:', err);
    }
  };

  // Fetch real database records from Supabase
  const refreshData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch Organisations
      const { data: orgsData } = await supabase.from('organisations').select('*');
      if (orgsData && orgsData.length > 0) {
        setOrganisations(orgsData);
        if (!activeOrg) setActiveOrg(orgsData[0]);
      }

      // 2. Fetch Users
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) {
        setAllUsers(usersData);
      }

      // 3. Fetch Quizzes
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*, organisation:organisations(*)');
      if (quizzesData) {
        setQuizzes(quizzesData);
      }

      // 4. Fetch Tournament Rounds
      const { data: roundsData } = await supabase.from('tournament_rounds').select('*');
      if (roundsData) {
        setRounds(roundsData);
      }

      // 5. Fetch Questions
      const { data: questionsData } = await supabase.from('questions').select('*');
      if (questionsData) {
        setQuestions(questionsData);
      }

      // 6. Fetch Entries
      const { data: entriesData } = await supabase
        .from('entries')
        .select('*, user:users(*), quiz:quizzes(*), round:tournament_rounds(*)');
      if (entriesData) {
        setEntries(entriesData);
      }

      // 7. Fetch Winners
      const { data: winnersData } = await supabase
        .from('winners')
        .select('*, user:users(*)');
      if (winnersData) {
        setWinners(winnersData);
      }

      // 8. Fetch Referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*, referee:users!referrals_referee_id_fkey(*), referrer:users!referrals_referrer_id_fkey(*)');
      if (referralsData) {
        setReferrals(referralsData);
      }
    } catch (e) {
      console.error('Supabase live fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Restore local cache if present
    try {
      const savedUser = localStorage.getItem('quizee_current_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {}

    // 2. Get real Supabase active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      }
    });

    // 3. Subscribe to real auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        try {
          localStorage.removeItem('quizee_current_user');
        } catch (e) {}
      }
    });

    refreshData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, _password?: string) => {
    const cleanUsername = username.trim().toLowerCase();
    
    // Query Supabase for username
    let user = allUsers.find((u) => u.username?.toLowerCase() === cleanUsername);

    if (!user) {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .ilike('username', cleanUsername)
          .single();
        if (data) user = data;
      } catch (e) {}
    }

    if (!user) {
      return register({ username: cleanUsername });
    }

    setCurrentUser(user);
    try {
      localStorage.setItem('quizee_current_user', JSON.stringify(user));
    } catch (e) {}

    return { success: true, user };
  };

  const loginWithGoogle = async (
    options:
      | 'admin'
      | 'superadmin'
      | 'participant'
      | { role?: 'admin' | 'superadmin' | 'participant'; referralCode?: string; orgId?: string } = 'admin'
  ) => {
    const role = typeof options === 'string' ? options : options.role || 'participant';
    const referralCode = typeof options === 'object' ? options.referralCode : undefined;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTo = `${origin}/auth/callback?role=${role}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ''}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Supabase Google OAuth Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const register = async ({
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
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      email: `${cleanUsername}@quizee.local`,
      full_name: fullName || cleanUsername,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&auto=format&fit=crop&q=80`,
      role: role,
      auth_provider: 'credentials',
      org_id: orgId || activeOrg?.id || null,
      referral_code: newRefCode,
      referred_by: referrer ? referrer.id : null,
      total_points: referrer ? 10 : 0,
      total_referrals: 0,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('users').insert(newUser);
    } catch (e) {}

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

      try {
        await supabase.from('referrals').insert({
          id: newReferral.id,
          referrer_id: referrer.id,
          referee_id: newUser.id,
          bonus_points_awarded: 25,
        });
      } catch (e) {}

      setReferrals((prev) => [newReferral, ...prev]);
    }

    try {
      localStorage.setItem('quizee_current_user', JSON.stringify(newUser));
    } catch (e) {}

    return { success: true, user: newUser };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setCurrentUser(null);
    try {
      localStorage.removeItem('quizee_current_user');
    } catch (e) {}
  };

  const switchUserRole = (role: 'superadmin' | 'admin' | 'participant') => {
    const targetUser = allUsers.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      try {
        localStorage.setItem('quizee_current_user', JSON.stringify(targetUser));
      } catch (e) {}
    } else {
      loginWithGoogle(role);
    }
  };

  const upgradeActiveOrgPlan = async (newPlan: PlanType) => {
    if (!activeOrg) return;
    const updatedOrg = { ...activeOrg, plan: newPlan };
    setActiveOrg(updatedOrg);
    setOrganisations((prev) => prev.map((o) => (o.id === activeOrg.id ? updatedOrg : o)));

    try {
      await supabase.from('organisations').update({ plan: newPlan }).eq('id', activeOrg.id);
    } catch (e) {}
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

  const createQuiz = async (quizData: Partial<Quiz>): Promise<{ success: boolean; quiz?: Quiz; error?: string }> => {
    const check = canCreateQuiz();
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const currentPlan: PlanType = activeOrg?.plan || 'free';
    const participantCap = currentPlan === 'free' ? 100 : null;

    const newQuiz: Quiz = {
      id: `qz-${Date.now()}`,
      org_id: activeOrg?.id || 'org-main',
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
      created_by: currentUser?.id || 'admin-host',
      created_at: new Date().toISOString(),
      organisation: activeOrg || undefined,
      questions_count: 0,
    };

    try {
      await supabase.from('quizzes').insert({
        id: newQuiz.id,
        org_id: newQuiz.org_id,
        title: newQuiz.title,
        description: newQuiz.description,
        banner_url: newQuiz.banner_url,
        quiz_type: newQuiz.quiz_type,
        progression_mode: newQuiz.progression_mode,
        scoring_strategy: newQuiz.scoring_strategy,
        base_points_per_question: newQuiz.base_points_per_question,
        time_limit_per_question_sec: newQuiz.time_limit_per_question_sec,
        shuffle_questions: newQuiz.shuffle_questions,
        shuffle_options: newQuiz.shuffle_options,
        enable_referral_bonus: newQuiz.enable_referral_bonus,
        referral_bonus_points: newQuiz.referral_bonus_points,
        status: newQuiz.status,
        max_participants: newQuiz.max_participants,
      });
    } catch (e) {}

    setQuizzes((prev) => [newQuiz, ...prev]);

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

  const updateQuiz = async (id: string, updates: Partial<Quiz>) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates, updated_at: new Date().toISOString() } : q))
    );
    try {
      await supabase.from('quizzes').update(updates).eq('id', id);
    } catch (e) {}
  };

  const deleteQuiz = async (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    try {
      await supabase.from('quizzes').delete().eq('id', id);
    } catch (e) {}
  };

  const addRound = async (quizId: string, roundData: Partial<TournamentRound>): Promise<TournamentRound> => {
    const existingForQuiz = rounds.filter((r) => r.quiz_id === quizId);
    const newRound: TournamentRound = {
      id: `rnd-${Date.now()}`,
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

    try {
      await supabase.from('tournament_rounds').insert(newRound);
    } catch (e) {}

    setRounds((prev) => [...prev, newRound]);
    return newRound;
  };

  const updateRound = async (roundId: string, updates: Partial<TournamentRound>) => {
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
    try {
      await supabase.from('tournament_rounds').update(updates).eq('id', roundId);
    } catch (e) {}
  };

  const deleteRound = async (roundId: string) => {
    setRounds((prev) => prev.filter((r) => r.id !== roundId));
    try {
      await supabase.from('tournament_rounds').delete().eq('id', roundId);
    } catch (e) {}
  };

  const addQuestion = async (qData: Partial<Question>): Promise<Question> => {
    const newQ: Question = {
      id: `qst-${Date.now()}`,
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

    try {
      await supabase.from('questions').insert(newQ);
    } catch (e) {}

    setQuestions((prev) => [...prev, newQ]);
    
    setQuizzes((prev) =>
      prev.map((qz) =>
        qz.id === qData.quiz_id ? { ...qz, questions_count: (qz.questions_count || 0) + 1 } : qz
      )
    );

    return newQ;
  };

  const updateQuestion = async (questionId: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...updates, updated_at: new Date().toISOString() } : q))
    );
    try {
      await supabase.from('questions').update(updates).eq('id', questionId);
    } catch (e) {}
  };

  const deleteQuestion = async (questionId: string) => {
    const target = questions.find((q) => q.id === questionId);
    if (!target) return;

    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setQuizzes((prev) =>
      prev.map((qz) =>
        qz.id === target.quiz_id ? { ...qz, questions_count: Math.max(0, (qz.questions_count || 1) - 1) } : qz
      )
    );

    try {
      await supabase.from('questions').delete().eq('id', questionId);
    } catch (e) {}
  };

  const submitQuizAttempt = async ({
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
      id: `ent-${Date.now()}`,
      quiz_id: quizId,
      round_id: roundId,
      user_id: currentUser?.id || 'guest-contestant',
      score: calculatedScore,
      total_correct: totalCorrectCount,
      total_time_taken_ms: totalTimeTaken,
      qualified_for_next_round: isQualified,
      status: 'submitted',
      started_at: new Date(Date.now() - totalTimeTaken).toISOString(),
      completed_at: new Date().toISOString(),
      user: currentUser || undefined,
      quiz: targetQuiz,
      round: targetRound,
    };

    try {
      await supabase.from('entries').insert({
        id: newEntry.id,
        quiz_id: newEntry.quiz_id,
        round_id: newEntry.round_id,
        user_id: newEntry.user_id,
        score: newEntry.score,
        total_correct: newEntry.total_correct,
        total_time_taken_ms: newEntry.total_time_taken_ms,
        qualified_for_next_round: newEntry.qualified_for_next_round,
        status: newEntry.status,
      });
    } catch (e) {}

    setEntries((prev) => [newEntry, ...prev]);

    if (currentUser) {
      setCurrentUser((prev) => prev ? ({
        ...prev,
        total_points: prev.total_points + calculatedScore,
      }) : null);
    }

    return {
      entry: newEntry,
      score: calculatedScore,
      qualified: isQualified,
      totalCorrect: totalCorrectCount,
    };
  };

  const manuallyQualifyEntry = async (entryId: string, qualified: boolean) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, qualified_for_next_round: qualified } : e))
    );
    try {
      await supabase.from('entries').update({ qualified_for_next_round: qualified }).eq('id', entryId);
    } catch (e) {}
  };

  const applyReferralCode = async (code: string): Promise<boolean> => {
    if (!currentUser) return false;
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

    try {
      await supabase.from('referrals').insert({
        id: newReferral.id,
        referrer_id: referrer.id,
        referee_id: currentUser.id,
        bonus_points_awarded: 25,
      });
    } catch (e) {}

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

    setCurrentUser((prev) => prev ? ({
      ...prev,
      referred_by: referrer.id,
      total_points: prev.total_points + 10,
    }) : null);

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
        isLoading,
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
        refreshData,
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

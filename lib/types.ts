export type UserRole = 'superadmin' | 'admin' | 'participant';
export type PlanType = 'free' | 'plus';

export type QuizType = 'single' | 'tournament';
export type ProgressionMode = 'manual' | 'automatic';
export type ScoringStrategy = 'fixed' | 'time_decay';
export type QuizStatus = 'draft' | 'published' | 'live' | 'completed' | 'archived';
export type RoundStatus = 'pending' | 'active' | 'completed';
export type EntryStatus = 'in_progress' | 'submitted' | 'disqualified';
export type AttachmentType = 'image' | 'audio' | 'document' | 'none';

export interface PlanLimits {
  name: string;
  price: string;
  maxParticipantsPerQuiz: number | 'unlimited';
  maxQuizzesPerMonth: number | 'unlimited';
  features: string[];
}

export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  free: {
    name: 'Free Starter',
    price: '$0 / month',
    maxParticipantsPerQuiz: 100,
    maxQuizzesPerMonth: 2,
    features: [
      'Up to 100 participants per quiz',
      'Max 2 quizzes created per month',
      'Fixed & Time-decay scoring',
      'Standard leaderboards',
      'Basic MCQ question bank',
    ],
  },
  plus: {
    name: 'Plus Pro',
    price: '$29 / month',
    maxParticipantsPerQuiz: 'unlimited',
    maxQuizzesPerMonth: 'unlimited',
    features: [
      'Unlimited participants per competition',
      'Unlimited quizzes & tournaments per month',
      'Multi-level tournament brackets',
      'Rich media diagrams & audio attachments',
      'Viral referral reward system',
      'Priority live monitor & winner exports',
    ],
  },
};

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: PlanType;
  quizzes_created_this_month: number;
  settings: {
    primary_color?: string;
    allow_public_registration?: boolean;
    banner_url?: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  username: string;
  email?: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  auth_provider?: 'credentials' | 'google';
  org_id: string | null;
  referral_code: string;
  referred_by: string | null;
  total_points: number;
  total_referrals: number;
  created_at: string;
  updated_at?: string;
  organisation?: Organisation;
}

export interface Quiz {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  quiz_type: QuizType;
  progression_mode: ProgressionMode;
  scoring_strategy: ScoringStrategy;
  base_points_per_question: number;
  time_limit_per_question_sec: number;
  total_time_limit_sec: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  enable_referral_bonus: boolean;
  referral_bonus_points: number;
  status: QuizStatus;
  max_participants: number | null; // 100 for Free, null for Unlimited (Plus)
  start_time: string | null;
  end_time: string | null;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
  organisation?: Organisation;
  rounds?: TournamentRound[];
  questions_count?: number;
}

export interface TournamentRound {
  id: string;
  quiz_id: string;
  round_number: number;
  title: string;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  min_score_to_qualify: number;
  min_correct_to_qualify: number;
  max_qualifiers: number | null;
  status: RoundStatus;
  created_at: string;
  updated_at?: string;
  questions?: Question[];
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  round_id: string | null;
  order_index: number;
  question_text: string;
  attachment_url: string | null;
  attachment_type: AttachmentType;
  points: number;
  time_limit_sec: number | null;
  options: QuestionOption[];
  explanation: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Entry {
  id: string;
  quiz_id: string;
  round_id: string | null;
  user_id: string;
  score: number;
  total_correct: number;
  total_time_taken_ms: number;
  qualified_for_next_round: boolean;
  status: EntryStatus;
  started_at: string;
  completed_at: string | null;
  user?: Profile;
  quiz?: Quiz;
  round?: TournamentRound;
}

export interface QuestionResponse {
  id: string;
  entry_id: string;
  question_id: string;
  selected_option_ids: string[];
  is_correct: boolean;
  time_taken_ms: number;
  points_awarded: number;
  created_at: string;
}

export interface Winner {
  id: string;
  quiz_id: string;
  round_id: string | null;
  user_id: string;
  rank: number;
  final_score: number;
  total_time_taken_ms: number;
  prize_or_badge: string | null;
  created_at: string;
  user?: Profile;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  quiz_id: string | null;
  bonus_points_awarded: number;
  created_at: string;
  referee?: Profile;
  referrer?: Profile;
}

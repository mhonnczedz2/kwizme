// Type definitions for Supabase database tables
// Generated based on the database schema

export interface Profile {
  id: string; // UUID
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  quiz_id: string; // UUID
  user_id: string; // UUID
  quiz_title: string;
  file_name: string;
  description: string | null;
  institution: string | null;
  program: string | null;
  course: string | null;
  course_code: string | null;
  topic: string | null;
  difficulty_level: 'easy' | 'medium' | 'hard' | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  question_id: number;
  quiz_id: string; // UUID
  question_text: string;
  options: string[]; // JSONB stored as array
  correct_answer: string;
  explanation: string | null;
  citation: string | null;
  hint: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  created_at: string;
}

export interface ReviewSession {
  session_id: string; // UUID
  user_id: string; // UUID
  quiz_id: string; // UUID
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  correct_answers: number | null;
  score_percentage: number | null;
  time_spent_seconds: number | null;
  quick_submit: boolean;
  show_explanation: boolean;
  time_limit_seconds: number | null;
  randomize_options: boolean;
  randomize_questions: boolean;
  num_questions_selected: number;
  preset_name: string | null;
}

export interface AnswerRecord {
  record_id: number;
  session_id: string; // UUID
  question_id: number;
  selected_answer_index: number;
  is_correct: boolean;
  time_spent_seconds: number | null;
  answered_at: string;
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      quizzes: {
        Row: Quiz;
        Insert: Omit<Quiz, 'quiz_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Quiz, 'quiz_id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'question_id' | 'created_at'>;
        Update: Partial<Omit<Question, 'question_id' | 'quiz_id' | 'created_at'>>;
      };
      review_sessions: {
        Row: ReviewSession;
        Insert: Omit<ReviewSession, 'session_id' | 'started_at'>;
        Update: Partial<Omit<ReviewSession, 'session_id' | 'user_id' | 'quiz_id' | 'started_at'>>;
      };
      answer_records: {
        Row: AnswerRecord;
        Insert: Omit<AnswerRecord, 'record_id' | 'answered_at'>;
        Update: Partial<Omit<AnswerRecord, 'record_id' | 'session_id' | 'question_id' | 'answered_at'>>;
      };
    };
  };
}

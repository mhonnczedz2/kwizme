// Type definitions for QuizMe database entities

export interface Quiz {
  quiz_id: string;
  quiz_title: string;
  file_name: string;
  institution?: string;
  program?: string;
  course?: string;
  course_code?: string;
  topic?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface Question {
  question_id: number;
  quiz_id: string;
  question_text: string;
  options: string; // JSON array stored as string
  correct_answer: string;
  correct_answer_index?: number; // Deprecated, for backward compatibility
  explanation: string;
  citation?: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ReviewSession {
  session_id: string;
  quiz_id: string;
  started_at: string;
  completed_at?: string;
  total_questions: number;
  correct_answers?: number;
  score_percentage?: number;
  time_spent_seconds?: number;

  // Configuration options
  quick_submit: boolean;
  show_explanation: boolean;
  time_limit_seconds?: number;
  randomize_options: boolean;
  randomize_questions: boolean;
  num_questions_selected: number;
  preset_name?: 'learn' | 'test' | 'fast_learn' | 'custom';
}

export interface AnswerRecord {
  record_id: number;
  session_id: string;
  question_id: number;
  selected_answer_index: number;
  is_correct: boolean;
  time_spent_seconds?: number;
  answered_at: string;
}

// API response types

export interface QuizGenerationResponse {
  quiz_id: string;
  quiz_title: string;
  file_name: string;
  topic: string;
  difficulty_level: string;
  institution?: string;
  program?: string;
  course?: string;
  course_code?: string;
  questions: {
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    citation?: string;
    hint?: string;
    difficulty: string;
  }[];
}

// Configuration types

export interface SessionConfig {
  quick_submit: boolean;
  show_explanation: boolean;
  time_limit_seconds: number | null;
  randomize_options: boolean;
  randomize_questions: boolean;
  num_questions_selected: number;
  preset_name: 'learn' | 'test' | 'fast_learn' | 'custom';
}

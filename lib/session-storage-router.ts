/**
 * Session Storage Router - Automatically routes session operations
 * to either localStorage (anonymous) or Supabase (authenticated)
 */

import type { User } from '@supabase/supabase-js'
import type { ReviewSession, AnswerRecord } from './db/types'

// LocalStorage operations
import {
  createSession as createSessionLocal,
  saveAnswer as saveAnswerLocal,
  completeSession as completeSessionLocal,
  getSessionsForQuiz as getSessionsForQuizLocal,
  getAnswersForSession as getAnswersForSessionLocal,
  deleteSessionsForQuiz as deleteSessionsForQuizLocal,
  getRecentQuizSessions as getRecentQuizSessionsLocal
} from './db/session-storage'

// Supabase operations
import {
  createSessionInSupabase,
  saveAnswerToSupabase,
  completeSessionInSupabase,
  getSessionsForQuizFromSupabase,
  getAnswersForSessionFromSupabase,
  deleteSessionsForQuizFromSupabase,
  getRecentQuizSessionsFromSupabase
} from './supabase/session-storage'

/**
 * Create a new quiz session - automatically routes to localStorage or Supabase
 */
export async function createSession(
  quizId: string,
  totalQuestions: number,
  user: User | null,
  config?: {
    quick_submit?: boolean
    show_explanation?: boolean
    time_limit_seconds?: number
    randomize_options?: boolean
    randomize_questions?: boolean
    num_questions_selected?: number
    preset_name?: string
  }
): Promise<string> {
  if (user) {
    console.log('☁️ Creating session in Supabase (logged in)')
    return await createSessionInSupabase(user.id, quizId, totalQuestions, config)
  } else {
    console.log('💾 Creating session in localStorage (anonymous)')
    return await createSessionLocal(quizId, totalQuestions, config)
  }
}

/**
 * Save an answer record - automatically routes to localStorage or Supabase
 */
export async function saveAnswer(
  sessionId: string,
  questionId: number,
  selectedAnswerIndex: number,
  isCorrect: boolean,
  user: User | null,
  timeSpentSeconds?: number
): Promise<void> {
  if (user) {
    await saveAnswerToSupabase(sessionId, questionId, selectedAnswerIndex, isCorrect, timeSpentSeconds)
  } else {
    await saveAnswerLocal(sessionId, questionId, selectedAnswerIndex, isCorrect, timeSpentSeconds)
  }
}

/**
 * Complete a session - automatically routes to localStorage or Supabase
 */
export async function completeSession(
  sessionId: string,
  correctAnswers: number,
  totalQuestions: number,
  user: User | null,
  timeSpentSeconds?: number
): Promise<void> {
  if (user) {
    console.log('☁️ Completing session in Supabase (logged in)')
    await completeSessionInSupabase(sessionId, correctAnswers, totalQuestions, timeSpentSeconds)
  } else {
    console.log('💾 Completing session in localStorage (anonymous)')
    await completeSessionLocal(sessionId, correctAnswers, totalQuestions, timeSpentSeconds)
  }
}

/**
 * Get all sessions for a quiz - automatically routes to localStorage or Supabase
 */
export async function getSessionsForQuiz(
  quizId: string,
  user: User | null
): Promise<ReviewSession[]> {
  if (user) {
    console.log('☁️ Loading sessions from Supabase (logged in)')
    return await getSessionsForQuizFromSupabase(quizId, user.id)
  } else {
    console.log('💾 Loading sessions from localStorage (anonymous)')
    return await getSessionsForQuizLocal(quizId)
  }
}

/**
 * Get all answer records for a session - automatically routes to localStorage or Supabase
 */
export async function getAnswersForSession(
  sessionId: string,
  user: User | null
): Promise<AnswerRecord[]> {
  if (user) {
    return await getAnswersForSessionFromSupabase(sessionId)
  } else {
    return await getAnswersForSessionLocal(sessionId)
  }
}

/**
 * Delete all sessions for a quiz - automatically routes to localStorage or Supabase
 */
export async function deleteSessionsForQuiz(
  quizId: string,
  user: User | null
): Promise<void> {
  if (user) {
    console.log('☁️ Deleting sessions from Supabase (logged in)')
    await deleteSessionsForQuizFromSupabase(quizId, user.id)
  } else {
    console.log('💾 Deleting sessions from localStorage (anonymous)')
    await deleteSessionsForQuizLocal(quizId)
  }
}

/**
 * Get the most recently taken quizzes - automatically routes to localStorage or Supabase
 */
export async function getRecentQuizSessions(
  user: User | null,
  limit: number = 5
): Promise<string[]> {
  if (user) {
    console.log('☁️ Loading recent sessions from Supabase (logged in)')
    return await getRecentQuizSessionsFromSupabase(user.id, limit)
  } else {
    console.log('💾 Loading recent sessions from localStorage (anonymous)')
    return await getRecentQuizSessionsLocal(limit)
  }
}

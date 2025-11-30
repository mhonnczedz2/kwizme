/**
 * Supabase Session Storage - Cloud storage for quiz sessions and answer records
 * Stores quiz history, results, and performance data in the cloud
 */

import { createClient } from '@/lib/supabase/client'
import type { ReviewSession, AnswerRecord } from '@/lib/db/types'

// Generate UUID in browser-compatible way
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Create a new quiz session in Supabase
 */
export async function createSessionInSupabase(
  userId: string,
  quizId: string,
  totalQuestions: number,
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
  const supabase = createClient()
  const sessionId = generateUUID()

  const { error } = await supabase
    .from('review_sessions')
    .insert({
      session_id: sessionId,
      user_id: userId,
      quiz_id: quizId,
      started_at: new Date().toISOString(),
      total_questions: totalQuestions,
      quick_submit: config?.quick_submit ?? false,
      show_explanation: config?.show_explanation ?? true,
      time_limit_seconds: config?.time_limit_seconds ?? null,
      randomize_options: config?.randomize_options ?? false,
      randomize_questions: config?.randomize_questions ?? false,
      num_questions_selected: config?.num_questions_selected ?? totalQuestions,
      preset_name: config?.preset_name ?? 'custom'
    })

  if (error) {
    console.error('❌ Error creating session in Supabase:', error)
    throw error
  }

  console.log('☁️ Session created in Supabase:', sessionId)
  return sessionId
}

/**
 * Save an answer record to Supabase
 */
export async function saveAnswerToSupabase(
  sessionId: string,
  questionId: number,
  selectedAnswerIndex: number,
  isCorrect: boolean,
  timeSpentSeconds?: number
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('answer_records')
    .insert({
      session_id: sessionId,
      question_id: questionId,
      selected_answer_index: selectedAnswerIndex,
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds ?? null,
      answered_at: new Date().toISOString()
    })

  if (error) {
    console.error('❌ Error saving answer to Supabase:', error)
    throw error
  }
}

/**
 * Complete a session with final score in Supabase
 */
export async function completeSessionInSupabase(
  sessionId: string,
  correctAnswers: number,
  totalQuestions: number,
  timeSpentSeconds?: number
): Promise<void> {
  const supabase = createClient()
  const scorePercentage = (correctAnswers / totalQuestions) * 100

  const { error } = await supabase
    .from('review_sessions')
    .update({
      completed_at: new Date().toISOString(),
      correct_answers: correctAnswers,
      score_percentage: scorePercentage,
      time_spent_seconds: timeSpentSeconds ?? null
    })
    .eq('session_id', sessionId)

  if (error) {
    console.error('❌ Error completing session in Supabase:', error)
    throw error
  }

  console.log('☁️ Session completed in Supabase:', sessionId, `Score: ${correctAnswers}/${totalQuestions}`)
}

/**
 * Get all sessions for a quiz from Supabase
 */
export async function getSessionsForQuizFromSupabase(
  quizId: string,
  userId: string
): Promise<ReviewSession[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching sessions from Supabase:', error)
    throw error
  }

  return data || []
}

/**
 * Get all answer records for a session from Supabase
 */
export async function getAnswersForSessionFromSupabase(
  sessionId: string
): Promise<AnswerRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('answer_records')
    .select('*')
    .eq('session_id', sessionId)
    .order('record_id', { ascending: true })

  if (error) {
    console.error('❌ Error fetching answers from Supabase:', error)
    throw error
  }

  // Transform to match local AnswerRecord type
  return (data || []).map((record: any) => ({
    record_id: record.record_id,
    session_id: record.session_id,
    question_id: record.question_id,
    selected_answer_index: record.selected_answer_index,
    is_correct: record.is_correct,
    time_spent_seconds: record.time_spent_seconds,
    answered_at: record.answered_at
  }))
}

/**
 * Delete all sessions for a quiz from Supabase (when quiz is deleted)
 */
export async function deleteSessionsForQuizFromSupabase(
  quizId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  // Get all session IDs for this quiz
  const sessions = await getSessionsForQuizFromSupabase(quizId, userId)

  // Delete answer records for each session
  for (const session of sessions) {
    const { error: answersError } = await supabase
      .from('answer_records')
      .delete()
      .eq('session_id', session.session_id)

    if (answersError) {
      console.error('❌ Error deleting answer records from Supabase:', answersError)
    }
  }

  // Delete sessions
  const { error: sessionsError } = await supabase
    .from('review_sessions')
    .delete()
    .eq('quiz_id', quizId)
    .eq('user_id', userId)

  if (sessionsError) {
    console.error('❌ Error deleting sessions from Supabase:', sessionsError)
    throw sessionsError
  }

  console.log(`☁️ Deleted ${sessions.length} sessions for quiz from Supabase: ${quizId}`)
}

/**
 * Get the most recently taken quizzes (by completed session) from Supabase
 */
export async function getRecentQuizSessionsFromSupabase(
  userId: string,
  limit: number = 5
): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('review_sessions')
    .select('quiz_id')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('❌ Error fetching recent quiz sessions from Supabase:', error)
    throw error
  }

  // Get unique quiz IDs
  const uniqueQuizIds = [...new Set((data || []).map(r => r.quiz_id))]
  return uniqueQuizIds
}

/**
 * Get a specific session by ID from Supabase
 */
export async function getSessionByIdFromSupabase(
  sessionId: string
): Promise<ReviewSession | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('❌ Error fetching session from Supabase:', error)
    throw error
  }

  return data
}

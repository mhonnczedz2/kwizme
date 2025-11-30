/**
 * Storage Router - Automatically routes storage operations
 * to either localStorage (anonymous) or Supabase (authenticated)
 */

import type { User } from '@supabase/supabase-js'
import type { QuizGenerationResponse, Quiz, Question } from './db/types'

// LocalStorage operations
import {
  saveQuizToDatabase as saveToLocal,
  getAllQuizzes as getAllFromLocal,
  getQuizById as getByIdFromLocal,
  updateQuizMetadata as updateMetadataLocal,
  deleteQuiz as deleteFromLocal,
  getQuizQuestionCount as getCountFromLocal,
  getQuestionById as getQuestionByIdFromLocal,
  updateQuestion as updateQuestionLocal,
  deleteQuestion as deleteQuestionLocal,
  addQuestionToQuiz as addQuestionLocal
} from './db/quiz-storage'

// Supabase operations
import {
  saveQuizToSupabase,
  getAllQuizzesFromSupabase,
  getQuizByIdFromSupabase,
  updateQuizMetadataInSupabase,
  deleteQuizFromSupabase,
  getQuizQuestionCountFromSupabase,
  getQuestionByIdFromSupabase,
  updateQuestionInSupabase,
  deleteQuestionFromSupabase,
  addQuestionToQuizInSupabase
} from './supabase/quiz-storage'

/**
 * Save a quiz - automatically routes to localStorage or Supabase
 */
export async function saveQuiz(
  quizData: QuizGenerationResponse,
  user: User | null
): Promise<void> {
  if (user) {
    // User is logged in - save to cloud
    console.log('☁️ Saving to Supabase (logged in)')
    await saveQuizToSupabase(quizData, user.id)
  } else {
    // Anonymous user - save to localStorage
    console.log('💾 Saving to localStorage (anonymous)')
    await saveToLocal(quizData)
  }
}

/**
 * Get all quizzes - automatically routes to localStorage or Supabase
 */
export async function getAllQuizzes(user: User | null): Promise<Quiz[]> {
  if (user) {
    console.log('☁️ Loading from Supabase (logged in)')
    return await getAllQuizzesFromSupabase(user.id)
  } else {
    console.log('💾 Loading from localStorage (anonymous)')
    return await getAllFromLocal()
  }
}

/**
 * Get a specific quiz by ID - automatically routes to localStorage or Supabase
 */
export async function getQuizById(
  quizId: string,
  user: User | null
): Promise<QuizGenerationResponse | null> {
  if (user) {
    console.log('☁️ Loading quiz from Supabase (logged in)')
    return await getQuizByIdFromSupabase(quizId, user.id)
  } else {
    console.log('💾 Loading quiz from localStorage (anonymous)')
    return await getByIdFromLocal(quizId)
  }
}

/**
 * Update quiz metadata - automatically routes to localStorage or Supabase
 */
export async function updateQuizMetadata(
  quizId: string,
  updates: {
    quiz_title?: string
    institution?: string
    program?: string
    course_code?: string
    topic?: string
    difficulty_level?: string
  },
  user: User | null
): Promise<void> {
  if (user) {
    console.log('☁️ Updating quiz in Supabase (logged in)')
    await updateQuizMetadataInSupabase(quizId, user.id, updates)
  } else {
    console.log('💾 Updating quiz in localStorage (anonymous)')
    await updateMetadataLocal(quizId, updates)
  }
}

/**
 * Delete a quiz - automatically routes to localStorage or Supabase
 */
export async function deleteQuiz(quizId: string, user: User | null): Promise<void> {
  if (user) {
    console.log('☁️ Deleting quiz from Supabase (logged in)')
    await deleteQuizFromSupabase(quizId, user.id)
  } else {
    console.log('💾 Deleting quiz from localStorage (anonymous)')
    await deleteFromLocal(quizId)
  }
}

/**
 * Get quiz question count - automatically routes to localStorage or Supabase
 */
export async function getQuizQuestionCount(
  quizId: string,
  user: User | null
): Promise<number> {
  if (user) {
    return await getQuizQuestionCountFromSupabase(quizId)
  } else {
    return await getCountFromLocal(quizId)
  }
}

/**
 * Get a question by ID - automatically routes to localStorage or Supabase
 */
export async function getQuestionById(
  questionId: number,
  user: User | null
): Promise<Question | null> {
  if (user) {
    return await getQuestionByIdFromSupabase(questionId)
  } else {
    return await getQuestionByIdFromLocal(questionId)
  }
}

/**
 * Update a question - automatically routes to localStorage or Supabase
 */
export async function updateQuestion(
  questionId: number,
  updates: {
    question_text?: string
    options?: string[]
    correct_answer?: string
    explanation?: string
    citation?: string
    hint?: string
    difficulty?: 'easy' | 'medium' | 'hard'
  },
  user: User | null
): Promise<void> {
  if (user) {
    console.log('☁️ Updating question in Supabase (logged in)')
    await updateQuestionInSupabase(questionId, updates)
  } else {
    console.log('💾 Updating question in localStorage (anonymous)')
    await updateQuestionLocal(questionId, updates)
  }
}

/**
 * Delete a question - automatically routes to localStorage or Supabase
 */
export async function deleteQuestion(
  questionId: number,
  user: User | null
): Promise<void> {
  if (user) {
    console.log('☁️ Deleting question from Supabase (logged in)')
    await deleteQuestionFromSupabase(questionId)
  } else {
    console.log('💾 Deleting question from localStorage (anonymous)')
    await deleteQuestionLocal(questionId)
  }
}

/**
 * Add a new question to a quiz - automatically routes to localStorage or Supabase
 */
export async function addQuestionToQuiz(
  quizId: string,
  question: {
    question_text: string
    options: string[]
    correct_answer: string
    explanation: string
    citation?: string
    hint?: string
    difficulty: 'easy' | 'medium' | 'hard'
  },
  user: User | null
): Promise<number> {
  if (user) {
    console.log('☁️ Adding question to Supabase (logged in)')
    return await addQuestionToQuizInSupabase(quizId, question)
  } else {
    console.log('💾 Adding question to localStorage (anonymous)')
    return await addQuestionLocal(quizId, question)
  }
}

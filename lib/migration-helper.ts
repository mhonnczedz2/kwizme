/**
 * Migration Helper - Migrate localStorage data to Supabase cloud
 * Helps users transfer their existing quizzes when they sign up or log in
 */

import type { User } from '@supabase/supabase-js'
import { getAllQuizzes as getAllFromLocal } from './db/quiz-storage'
import { saveQuizToSupabase } from './supabase/quiz-storage'
import type { Quiz } from './db/types'

export interface MigrationStatus {
  total: number
  completed: number
  failed: number
  currentQuiz?: string
  errors: Array<{ quizId: string; title: string; error: string }>
}

/**
 * Check if user has any quizzes in localStorage that need migration
 */
export async function hasLocalQuizzes(): Promise<boolean> {
  try {
    const localQuizzes = await getAllFromLocal()
    return localQuizzes.length > 0
  } catch (error) {
    console.error('Error checking for local quizzes:', error)
    return false
  }
}

/**
 * Get count of quizzes in localStorage
 */
export async function getLocalQuizCount(): Promise<number> {
  try {
    const localQuizzes = await getAllFromLocal()
    return localQuizzes.length
  } catch (error) {
    console.error('Error getting local quiz count:', error)
    return 0
  }
}

/**
 * Migrate all localStorage quizzes to Supabase
 * Returns migration status with progress updates via callback
 */
export async function migrateQuizzesToCloud(
  user: User,
  onProgress?: (status: MigrationStatus) => void
): Promise<MigrationStatus> {
  const status: MigrationStatus = {
    total: 0,
    completed: 0,
    failed: 0,
    errors: []
  }

  try {
    // Get all quizzes from localStorage
    const localQuizzes = await getAllFromLocal()
    status.total = localQuizzes.length

    if (status.total === 0) {
      return status
    }

    // Migrate each quiz
    for (const quiz of localQuizzes) {
      status.currentQuiz = quiz.quiz_title

      // Notify progress
      if (onProgress) {
        onProgress({ ...status })
      }

      try {
        // We need to get the full quiz with questions
        const { getQuizById } = await import('./db/quiz-storage')
        const fullQuiz = await getQuizById(quiz.quiz_id)

        if (!fullQuiz) {
          throw new Error('Quiz not found in localStorage')
        }

        // Save to Supabase
        await saveQuizToSupabase(fullQuiz, user.id)

        status.completed++
        console.log(`✅ Migrated: ${quiz.quiz_title}`)
      } catch (error: any) {
        status.failed++
        status.errors.push({
          quizId: quiz.quiz_id,
          title: quiz.quiz_title,
          error: error.message || 'Unknown error'
        })
        console.error(`❌ Failed to migrate ${quiz.quiz_title}:`, error)
      }

      // Notify progress after each quiz
      if (onProgress) {
        onProgress({ ...status })
      }
    }

    status.currentQuiz = undefined
    return status
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

/**
 * Clear localStorage quizzes after successful migration
 * CAUTION: This permanently deletes local data
 */
export async function clearLocalQuizzes(): Promise<void> {
  try {
    const { initDatabase, saveDatabase } = await import('./db/client')
    const db = await initDatabase()

    // Clear all quizzes and questions from localStorage
    db.run('DELETE FROM questions')
    db.run('DELETE FROM quizzes')

    // Save the empty database
    saveDatabase(db)

    console.log('🗑️ Cleared all localStorage quizzes')
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    throw error
  }
}

/**
 * Verify migration by comparing counts
 */
export async function verifyMigration(user: User): Promise<{
  localCount: number
  cloudCount: number
  migrationNeeded: boolean
}> {
  try {
    const { getAllQuizzes: getAllFromLocal } = await import('./db/quiz-storage')
    const { getAllQuizzesFromSupabase } = await import('./supabase/quiz-storage')

    const localQuizzes = await getAllFromLocal()
    const cloudQuizzes = await getAllQuizzesFromSupabase(user.id)

    return {
      localCount: localQuizzes.length,
      cloudCount: cloudQuizzes.length,
      migrationNeeded: localQuizzes.length > 0
    }
  } catch (error) {
    console.error('Error verifying migration:', error)
    throw error
  }
}

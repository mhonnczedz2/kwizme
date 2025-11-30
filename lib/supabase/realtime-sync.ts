/**
 * Supabase Realtime Sync - Cross-device synchronization for quizzes and sessions
 * Listens for changes in the cloud database and syncs data in real-time
 */

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type SyncEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface QuizSyncEvent {
  type: SyncEventType
  quizId: string
  timestamp: string
}

export interface SessionSyncEvent {
  type: SyncEventType
  sessionId: string
  quizId: string
  timestamp: string
}

/**
 * Subscribe to quiz changes for the current user
 * Triggers callback when quizzes are added, updated, or deleted
 */
export function subscribeToQuizChanges(
  userId: string,
  onQuizChange: (event: QuizSyncEvent) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel('quiz-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quizzes',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('🔄 Quiz change detected:', payload)

        const event: QuizSyncEvent = {
          type: payload.eventType as SyncEventType,
          quizId: (payload.new as any)?.quiz_id || (payload.old as any)?.quiz_id,
          timestamp: new Date().toISOString()
        }

        onQuizChange(event)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to quiz changes')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to quiz changes')
      }
    })

  return channel
}

/**
 * Subscribe to session changes for the current user
 * Triggers callback when review sessions are added, updated, or deleted
 */
export function subscribeToSessionChanges(
  userId: string,
  onSessionChange: (event: SessionSyncEvent) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel('session-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'review_sessions',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('🔄 Session change detected:', payload)

        const event: SessionSyncEvent = {
          type: payload.eventType as SyncEventType,
          sessionId: (payload.new as any)?.session_id || (payload.old as any)?.session_id,
          quizId: (payload.new as any)?.quiz_id || (payload.old as any)?.quiz_id,
          timestamp: new Date().toISOString()
        }

        onSessionChange(event)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to session changes')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to session changes')
      }
    })

  return channel
}

/**
 * Subscribe to question changes for a specific quiz
 * Useful for real-time question editing across devices
 */
export function subscribeToQuestionChanges(
  quizId: string,
  onQuestionChange: (event: { type: SyncEventType; questionId: number }) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`question-changes-${quizId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'questions',
        filter: `quiz_id=eq.${quizId}`
      },
      (payload) => {
        console.log('🔄 Question change detected:', payload)

        const event = {
          type: payload.eventType as SyncEventType,
          questionId: (payload.new as any)?.question_id || (payload.old as any)?.question_id
        }

        onQuestionChange(event)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to question changes for quiz ${quizId}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Error subscribing to question changes for quiz ${quizId}`)
      }
    })

  return channel
}

/**
 * Unsubscribe from a Realtime channel
 */
export async function unsubscribeChannel(channel: RealtimeChannel): Promise<void> {
  const supabase = createClient()
  await supabase.removeChannel(channel)
  console.log('🔌 Unsubscribed from Realtime channel')
}

/**
 * Subscribe to all changes (quizzes + sessions) for the current user
 * Returns an object with both channels for easy cleanup
 */
export function subscribeToAllChanges(
  userId: string,
  callbacks: {
    onQuizChange: (event: QuizSyncEvent) => void
    onSessionChange: (event: SessionSyncEvent) => void
  }
): { quizChannel: RealtimeChannel; sessionChannel: RealtimeChannel } {
  const quizChannel = subscribeToQuizChanges(userId, callbacks.onQuizChange)
  const sessionChannel = subscribeToSessionChanges(userId, callbacks.onSessionChange)

  return { quizChannel, sessionChannel }
}

/**
 * Unsubscribe from all channels
 */
export async function unsubscribeAll(channels: {
  quizChannel: RealtimeChannel
  sessionChannel: RealtimeChannel
}): Promise<void> {
  await unsubscribeChannel(channels.quizChannel)
  await unsubscribeChannel(channels.sessionChannel)
}

'use client'

import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { hasLocalQuizzes, migrateQuizzesToCloud, type MigrationStatus } from '@/lib/migration-helper'

interface AutoMigrationOptions {
  enabled?: boolean
  delayOnLogin?: number // Delay in ms after login before starting migration
  checkInterval?: number // How often to check for local quizzes (in ms)
}

interface AutoMigrationState {
  isChecking: boolean
  isMigrating: boolean
  migrationStatus: MigrationStatus | null
  lastChecked: Date | null
  error: string | null
}

/**
 * Hook to automatically migrate local quizzes to cloud when user is authenticated
 *
 * Features:
 * - Automatically checks for local quizzes when user logs in
 * - Migrates quizzes in the background without user intervention
 * - Provides migration status for UI feedback
 * - Handles errors gracefully
 * - Prevents duplicate migrations
 *
 * @param user - The authenticated user (null if not logged in)
 * @param options - Configuration options
 */
export function useAutoMigration(
  user: User | null,
  options: AutoMigrationOptions = {}
) {
  const {
    enabled = true,
    delayOnLogin = 3000, // Wait 3 seconds after login
    checkInterval = 60000, // Check every minute
  } = options

  const [state, setState] = useState<AutoMigrationState>({
    isChecking: false,
    isMigrating: false,
    migrationStatus: null,
    lastChecked: null,
    error: null,
  })

  const migrationInProgressRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  // Check and migrate function
  const checkAndMigrate = async () => {
    if (!user || !enabled || migrationInProgressRef.current) {
      return
    }

    try {
      setState(prev => ({ ...prev, isChecking: true, error: null }))

      const hasLocal = await hasLocalQuizzes()
      setState(prev => ({ ...prev, lastChecked: new Date() }))

      if (hasLocal) {
        console.log('🔄 Auto-migration: Local quizzes detected, starting automatic migration...')

        migrationInProgressRef.current = true
        setState(prev => ({ ...prev, isMigrating: true }))

        const status = await migrateQuizzesToCloud(user, (progress) => {
          setState(prev => ({
            ...prev,
            migrationStatus: progress,
          }))
        })

        console.log('✅ Auto-migration completed:', status)

        setState(prev => ({
          ...prev,
          isMigrating: false,
          migrationStatus: status,
        }))

        migrationInProgressRef.current = false
      } else {
        console.log('✓ Auto-migration: No local quizzes to migrate')
      }
    } catch (error) {
      console.error('❌ Auto-migration error:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Migration failed',
        isMigrating: false,
      }))
      migrationInProgressRef.current = false
    } finally {
      setState(prev => ({ ...prev, isChecking: false }))
    }
  }

  // Effect: Check on login and periodically
  useEffect(() => {
    if (!user || !enabled) {
      return
    }

    // Check if this is a new login (user ID changed)
    const isNewLogin = lastUserIdRef.current !== user.id
    lastUserIdRef.current = user.id

    if (isNewLogin) {
      // Wait a bit before starting migration on login
      const loginTimeout = setTimeout(() => {
        checkAndMigrate()
      }, delayOnLogin)

      return () => clearTimeout(loginTimeout)
    } else {
      // Set up periodic checking for existing session
      checkAndMigrate() // Check immediately

      const interval = setInterval(() => {
        checkAndMigrate()
      }, checkInterval)

      return () => clearInterval(interval)
    }
  }, [user?.id, enabled, delayOnLogin, checkInterval])

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      lastUserIdRef.current = null
      migrationInProgressRef.current = false
      setState({
        isChecking: false,
        isMigrating: false,
        migrationStatus: null,
        lastChecked: null,
        error: null,
      })
    }
  }, [user])

  return {
    ...state,
    // Manual trigger (if needed)
    triggerMigration: checkAndMigrate,
  }
}

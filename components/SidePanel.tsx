'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useSyncStatus } from '@/lib/hooks/useRealtimeSync'
import { useAutoMigration } from '@/lib/hooks/useAutoMigration'

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onLogout: () => void
}

export default function SidePanel({ isOpen, onClose, user, onLogout }: SidePanelProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [institution, setInstitution] = useState('')
  const [program, setProgram] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Check real-time sync status
  const isSyncActive = useSyncStatus(user)

  // Automatic migration hook - migrates local quizzes automatically
  const migration = useAutoMigration(user, {
    enabled: true,
    delayOnLogin: 3000, // Wait 3 seconds after login
    checkInterval: 60000, // Check every minute
  })

  // Load user metadata when panel opens or user changes
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.user_metadata?.full_name || '')
      setInstitution(user.user_metadata?.institution || '')
      setProgram(user.user_metadata?.program || '')
    }
  }, [user, isOpen])

  const handleLogin = () => {
    console.log('🔵 handleLogin called - navigating to /auth/login')
    router.push('/auth/login')
    onClose()
  }

  const handleSignup = () => {
    console.log('🔵 handleSignup called - navigating to /auth/signup')
    router.push('/auth/signup')
    onClose()
  }

  const handleLogoutClick = () => {
    onLogout()
    onClose()
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
    setSaveSuccess(false)

    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          institution: institution || null,
          program: program || null,
        }
      })

      if (error) throw error

      setSaveSuccess(true)
      setTimeout(() => {
        setIsEditing(false)
        setSaveSuccess(false)
      }, 1500)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    // Reset to original values
    if (user) {
      setFullName(user.user_metadata?.full_name || '')
      setInstitution(user.user_metadata?.institution || '')
      setProgram(user.user_metadata?.program || '')
    }
    setIsEditing(false)
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-full md:w-80 bg-gray-50 dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Menu</h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition p-2"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {user ? (
              /* Logged In View */
              <div className="space-y-6">
                {/* User Avatar */}
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                {!isEditing ? (
                  /* View Mode */
                  <>
                    {/* User Info */}
                    <div className="text-center space-y-2">
                      {user.user_metadata?.full_name && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {user.user_metadata.full_name}
                        </h3>
                      )}
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                          {user.email}
                        </p>
                        {user.email_confirmed_at && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full border border-green-200 dark:border-green-800">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                      {user.user_metadata?.institution && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-600 dark:text-gray-300">Institution: </span>
                          {user.user_metadata.institution}
                        </div>
                      )}
                      {user.user_metadata?.program && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-600 dark:text-gray-300">Program: </span>
                          {user.user_metadata.program}
                        </div>
                      )}
                    </div>

                    {/* Account Actions - Compact */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-sm font-medium py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                      <button
                        onClick={handleLogoutClick}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    {/* Status Badge */}
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isSyncActive ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`}></div>
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              {isSyncActive ? 'Synced' : 'Signed In'}
                            </span>
                          </div>
                          {migration.migrationStatus &&
                           migration.migrationStatus.completed === migration.migrationStatus.total &&
                           migration.migrationStatus.failed === 0 &&
                           !migration.isMigrating && (
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                              {migration.migrationStatus.total} {migration.migrationStatus.total === 1 ? 'quiz' : 'quizzes'} synced
                            </p>
                          )}
                        </div>
                        {migration.migrationStatus &&
                         migration.migrationStatus.completed === migration.migrationStatus.total &&
                         migration.migrationStatus.failed === 0 &&
                         !migration.isMigrating && (
                          <svg className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Auto-Migration Status */}
                    {migration.isMigrating && (
                      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Migrating quizzes to cloud...</p>
                            {migration.migrationStatus && (
                              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                {migration.migrationStatus.completed} of {migration.migrationStatus.total} completed
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Migration Error */}
                    {migration.error && (
                      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-red-900 dark:text-red-300">Migration issue</p>
                            <p className="text-xs text-red-700 dark:text-red-400 mt-1">{migration.error}</p>
                            <button
                              onClick={() => migration.triggerMigration()}
                              className="text-xs text-red-600 dark:text-red-400 underline mt-1 hover:text-red-800 dark:hover:text-red-300"
                            >
                              Retry migration
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Edit Mode */
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                        Edit Profile
                      </h3>

                      {saveSuccess && (
                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                            Profile updated successfully!
                          </p>
                        </div>
                      )}

                      {/* Email (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email || ''}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition text-sm"
                          placeholder="Your name"
                        />
                      </div>

                      {/* Institution */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Institution <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition text-sm"
                          placeholder="e.g., Harvard University"
                        />
                      </div>

                      {/* Program */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Program <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={program}
                          onChange={(e) => setProgram(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition text-sm"
                          placeholder="e.g., Computer Science"
                        />
                      </div>

                      {/* Save/Cancel Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex-1 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Logged Out View */
              <div className="space-y-6">
                {/* Welcome Message */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Welcome to QuizMe
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sign in to sync your quizzes across all your devices
                  </p>
                </div>

                {/* Benefits */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 italic">
                    What signing up does?
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Access your quizzes from any device</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Never lose your progress</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Cloud backup of all your data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Share quizzes with friends (coming soon)</span>
                    </li>
                  </ul>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700"></div>

                {/* Auth Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleSignup}
                    className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={handleLogin}
                    className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold py-3 px-4 rounded-lg transition border-2 border-gray-300 dark:border-gray-600"
                  >
                    Sign In
                  </button>
                </div>

                {/* Local Mode Notice */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    You can continue using QuizMe without an account. Your data will be stored locally on this device.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              QuizMe v0.1.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

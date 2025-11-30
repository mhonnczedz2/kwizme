'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import MigrationPanel from './MigrationPanel'
import { hasLocalQuizzes } from '@/lib/migration-helper'
import { useSyncStatus } from '@/lib/hooks/useRealtimeSync'

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
  const [showMigration, setShowMigration] = useState(false)
  const [needsMigration, setNeedsMigration] = useState(false)
  const [fullName, setFullName] = useState('')
  const [institution, setInstitution] = useState('')
  const [program, setProgram] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Check real-time sync status
  const isSyncActive = useSyncStatus(user)

  // Load user metadata when panel opens or user changes
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.user_metadata?.full_name || '')
      setInstitution(user.user_metadata?.institution || '')
      setProgram(user.user_metadata?.program || '')
    }
  }, [user, isOpen])

  // Check for migration needs when user logs in
  useEffect(() => {
    if (user && isOpen) {
      checkMigrationNeeded()
    }
  }, [user, isOpen])

  const checkMigrationNeeded = async () => {
    try {
      const hasLocal = await hasLocalQuizzes()
      setNeedsMigration(hasLocal)
    } catch (error) {
      console.error('Error checking migration status:', error)
    }
  }

  const handleLogin = () => {
    onClose()
    router.push('/auth/login')
  }

  const handleSignup = () => {
    onClose()
    router.push('/auth/signup')
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-2"
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
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.user_metadata.full_name}
                        </h3>
                      )}
                      <p className="text-sm text-gray-600 break-all">
                        {user.email}
                      </p>
                      {user.user_metadata?.institution && (
                        <p className="text-sm text-gray-500">
                          {user.user_metadata.institution}
                        </p>
                      )}
                      {user.user_metadata?.program && (
                        <p className="text-sm text-gray-500">
                          {user.user_metadata.program}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isSyncActive ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className="text-sm font-medium text-green-700">
                          {isSyncActive ? 'Synced' : 'Signed In'}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {isSyncActive ? 'Real-time sync active' : 'Your data syncs across devices'}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200"></div>

                    {/* Migration Notice */}
                    {needsMigration && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-yellow-900">Local quizzes detected</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Migrate your quizzes to the cloud for cross-device access
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Actions */}
                    <div className="space-y-3">
                      {needsMigration && (
                        <button
                          onClick={() => setShowMigration(true)}
                          className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 border border-yellow-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Migrate to Cloud
                        </button>
                      )}
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                      <button
                        onClick={handleLogoutClick}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  /* Edit Mode */
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 text-center">
                        Edit Profile
                      </h3>

                      {saveSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-green-700 font-medium">
                            Profile updated successfully!
                          </p>
                        </div>
                      )}

                      {/* Email (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email || ''}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                          placeholder="Your name"
                        />
                      </div>

                      {/* Institution */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Institution <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                          placeholder="e.g., Harvard University"
                        />
                      </div>

                      {/* Program */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Program <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={program}
                          onChange={(e) => setProgram(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                          placeholder="e.g., Computer Science"
                        />
                      </div>

                      {/* Save/Cancel Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 text-sm"
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
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Welcome to QuizMe
                  </h3>
                  <p className="text-sm text-gray-600">
                    Sign in to sync your quizzes across all your devices
                  </p>
                </div>

                {/* Benefits */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-blue-900">
                    Benefits of signing up:
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Access your quizzes from any device</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Never lose your progress</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Cloud backup of all your data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Share quizzes with friends (coming soon)</span>
                    </li>
                  </ul>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Auth Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleSignup}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={handleLogin}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition"
                  >
                    Sign In
                  </button>
                </div>

                {/* Local Mode Notice */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 text-center">
                    You can continue using QuizMe without an account. Your data will be stored locally on this device.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500 text-center">
              QuizMe v0.1.0
            </p>
          </div>
        </div>
      </div>

      {/* Migration Modal */}
      {showMigration && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <MigrationPanel
            user={user}
            onClose={() => {
              setShowMigration(false)
              checkMigrationNeeded() // Refresh migration status
            }}
          />
        </div>
      )}
    </>
  )
}

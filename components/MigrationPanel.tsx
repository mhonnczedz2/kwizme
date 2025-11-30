'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  hasLocalQuizzes,
  getLocalQuizCount,
  migrateQuizzesToCloud,
  clearLocalQuizzes,
  verifyMigration,
  type MigrationStatus
} from '@/lib/migration-helper'

interface MigrationPanelProps {
  user: User
  onClose: () => void
}

export default function MigrationPanel({ user, onClose }: MigrationPanelProps) {
  const [hasLocal, setHasLocal] = useState(false)
  const [localCount, setLocalCount] = useState(0)
  const [checking, setChecking] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for local quizzes on mount
  useEffect(() => {
    checkForLocalQuizzes()
  }, [])

  const checkForLocalQuizzes = async () => {
    setChecking(true)
    try {
      const hasQuizzes = await hasLocalQuizzes()
      const count = await getLocalQuizCount()
      setHasLocal(hasQuizzes)
      setLocalCount(count)
    } catch (error) {
      console.error('Error checking for local quizzes:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleStartMigration = async () => {
    setMigrating(true)
    setError(null)

    try {
      const finalStatus = await migrateQuizzesToCloud(user, (status) => {
        setMigrationStatus(status)
      })

      setMigrationStatus(finalStatus)
      setMigrationComplete(true)

      // If all migrated successfully, show success
      if (finalStatus.failed === 0) {
        console.log('✅ All quizzes migrated successfully!')
      }
    } catch (error: any) {
      setError(error.message || 'Migration failed')
      console.error('Migration error:', error)
    } finally {
      setMigrating(false)
    }
  }

  const handleClearLocal = async () => {
    if (!confirm('Are you sure you want to delete your local quizzes? This cannot be undone.')) {
      return
    }

    try {
      await clearLocalQuizzes()
      setHasLocal(false)
      setLocalCount(0)
      alert('Local quizzes cleared successfully!')
    } catch (error: any) {
      alert('Failed to clear local quizzes: ' + error.message)
    }
  }

  const handleVerifyMigration = async () => {
    try {
      const result = await verifyMigration(user)
      alert(
        `Verification Results:\n\n` +
        `Local Quizzes: ${result.localCount}\n` +
        `Cloud Quizzes: ${result.cloudCount}\n\n` +
        `${result.migrationNeeded ? 'Migration still needed' : 'Migration complete!'}`
      )
    } catch (error: any) {
      alert('Verification failed: ' + error.message)
    }
  }

  if (checking) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Checking for local quizzes...</p>
        </div>
      </div>
    )
  }

  if (!hasLocal && !migrationComplete) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">All Set!</h3>
            <p className="text-sm text-blue-700">
              No local quizzes found. All your quizzes are already in the cloud.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Migrate to Cloud</h2>
          <p className="text-sm text-gray-600 mt-1">
            Move your local quizzes to the cloud for access from any device
          </p>
        </div>
      </div>

      {!migrationComplete ? (
        <>
          {/* Quiz Count */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Local quizzes found:</span>
              <span className="text-2xl font-bold text-blue-600">{localCount}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Migration Progress */}
          {migrating && migrationStatus && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Migrating...</span>
                <span className="text-sm text-gray-600">
                  {migrationStatus.completed + migrationStatus.failed} / {migrationStatus.total}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((migrationStatus.completed + migrationStatus.failed) / migrationStatus.total) * 100}%`
                  }}
                ></div>
              </div>

              {/* Current Quiz */}
              {migrationStatus.currentQuiz && (
                <p className="text-xs text-gray-500 mt-2">
                  Current: {migrationStatus.currentQuiz}
                </p>
              )}

              {/* Status Summary */}
              <div className="mt-3 flex gap-4 text-xs">
                <span className="text-green-600">✓ {migrationStatus.completed} completed</span>
                {migrationStatus.failed > 0 && (
                  <span className="text-red-600">✗ {migrationStatus.failed} failed</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleStartMigration}
              disabled={migrating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {migrating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Migrating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Start Migration
                </>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={migrating}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              Maybe Later
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Your local quizzes will remain on this device after migration.
              You can delete them manually if needed.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Migration Complete */}
          <div className="mb-6">
            <div className={`p-4 rounded-lg border-2 ${
              migrationStatus?.failed === 0
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                <svg
                  className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                    migrationStatus?.failed === 0 ? 'text-green-600' : 'text-yellow-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className={`font-semibold mb-2 ${
                    migrationStatus?.failed === 0 ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    Migration {migrationStatus?.failed === 0 ? 'Complete!' : 'Finished with Errors'}
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className="text-green-700">
                      ✓ {migrationStatus?.completed} quizzes migrated successfully
                    </p>
                    {migrationStatus && migrationStatus.failed > 0 && (
                      <p className="text-red-700">
                        ✗ {migrationStatus.failed} quizzes failed to migrate
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {migrationStatus && migrationStatus.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-900 mb-2">Failed Quizzes:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  {migrationStatus.errors.map((err, idx) => (
                    <li key={idx}>
                      • {err.title}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Post-Migration Actions */}
          <div className="space-y-3">
            <button
              onClick={handleVerifyMigration}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify Migration
            </button>

            {migrationStatus?.failed === 0 && (
              <button
                onClick={handleClearLocal}
                className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Local Quizzes
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
            >
              Done
            </button>
          </div>
        </>
      )}
    </div>
  )
}

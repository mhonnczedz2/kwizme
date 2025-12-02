'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [gridDirection, setGridDirection] = useState('40px 40px')
  const [sessionValid, setSessionValid] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleBackToHome = () => {
    console.log('🔵 handleBackToHome called - navigating to /')
    window.location.href = '/'
  }

  // Validate password reset session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Small delay to ensure session is set after redirect from callback
        await new Promise(resolve => setTimeout(resolve, 100))

        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          setError('Invalid or expired password reset link. Please request a new one.')
          setSessionValid(false)
          return
        }

        // Check if we have a session (password reset creates a recovery session)
        if (!session) {
          console.error('No session found')
          setError('Invalid or expired password reset link. Please request a new one.')
          setSessionValid(false)
          return
        }

        // Session exists - user can reset password
        console.log('Valid session found for user:', session.user.email)
        setSessionValid(true)
      } catch (err) {
        console.error('Error checking session:', err)
        setError('Failed to validate reset link. Please try again.')
        setSessionValid(false)
      }
    }

    checkSession()
  }, [supabase])

  // Change grid direction randomly every animation cycle (8s)
  useEffect(() => {
    const directions = [
      '40px 40px',   // diagonal down-right
      '-40px 40px',  // diagonal down-left
      '40px -40px',  // diagonal up-right
      '-40px -40px', // diagonal up-left
    ]

    const changeDirection = () => {
      const randomDirection = directions[Math.floor(Math.random() * directions.length)]
      setGridDirection(randomDirection)
    }

    // Change direction every 8 seconds (matching animation cycle)
    const intervalId = setInterval(changeDirection, 8000)

    return () => clearInterval(intervalId)
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking session
  if (sessionValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Show error if session is invalid
  if (sessionValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || 'This password reset link is invalid or has expired. Please request a new one.'}
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        {/* Background Pattern */}
        <div
          className="fixed inset-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none animate-grid-pan"
          style={{
            backgroundImage: `
              linear-gradient(to right, #3b82f6 1px, transparent 1px),
              linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            '--grid-end-position': gridDirection,
          } as React.CSSProperties & { '--grid-end-position': string }}
        ></div>

        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="grid grid-cols-3 items-center px-4 lg:px-6 py-2 lg:py-3">
            <div></div>
            <button
              onClick={handleBackToHome}
              className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent text-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              QuizMe
            </button>
            <div className="flex items-center justify-end">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-md mt-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Password Reset!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your password has been successfully updated. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none animate-grid-pan"
        style={{
          backgroundImage: `
            linear-gradient(to right, #3b82f6 1px, transparent 1px),
            linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          '--grid-end-position': gridDirection,
        } as React.CSSProperties & { '--grid-end-position': string }}
      ></div>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-3 items-center px-4 lg:px-6 py-2 lg:py-3">
          <div></div>
          <button
            onClick={handleBackToHome}
            className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent text-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            QuizMe
          </button>
          <div className="flex items-center justify-end">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 w-full max-w-md text-center mt-24 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Reset Your Password
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Enter your new password below</p>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

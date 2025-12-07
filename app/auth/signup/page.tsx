'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import TopBanner from '@/components/TopBanner'
import SidePanel from '@/components/SidePanel'
import FeedbackDrawer from '@/components/FeedbackDrawer'
import { trackUserSignup } from '@/lib/analytics'

// Force dynamic rendering - don't prerender this page
export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [institution, setInstitution] = useState('')
  const [program, setProgram] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showInfoBubble, setShowInfoBubble] = useState(false)
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [gridDirection, setGridDirection] = useState('40px 40px')
  const router = useRouter()
  const supabase = createClient()

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Change grid direction randomly every animation cycle (8s)
  useEffect(() => {
    const directions = [
      '40px 40px',   // diagonal down-right
      '-40px 40px',  // diagonal down-left
      '40px -40px',  // diagonal up-right
      '-40px -40px', // diagonal up-left
    ];

    const changeDirection = () => {
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      setGridDirection(randomDirection);
    };

    // Change direction every 8 seconds (matching animation cycle)
    const intervalId = setInterval(changeDirection, 8000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate terms agreement
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to continue')
      setLoading(false)
      return
    }

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
      // Get the current site URL for email redirects
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            institution: institution || null,
            program: program || null,
          },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      })

      if (error) throw error

      // Check if this is an existing user (user exists but no session created)
      // Supabase returns identities: [] when email already exists
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Email already registered (verified or unverified)
        setError('This email is already registered. Please login instead.')
      } else if (data.user) {
        // New user signup successful - show email confirmation screen
        setSuccess(true)

        // Track successful user signup
        trackUserSignup({
          source: 'direct',
          referrer: document.referrer,
          hasExistingData: false // New signups don't have existing data
        });
      } else {
        // This shouldn't happen, but handle it gracefully
        throw new Error('Signup succeeded but no user data returned')
      }

      // Don't auto-redirect - let user read the message and navigate manually
    } catch (err: any) {
      // Handle specific error messages
      if (err.message.includes('already registered') || err.message.includes('already been registered') || err.message.includes('User already registered')) {
        setError('This email is already registered. Please login instead.')
      } else if (err.message.includes('email')) {
        setError('Invalid email address. Please check and try again.')
      } else {
        setError(err.message || 'Failed to create account')
      }
    } finally {
      setLoading(false)
    }
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

        {/* Side Panel */}
        <SidePanel
          isOpen={showSidePanel}
          onClose={() => setShowSidePanel(false)}
          user={user}
          onLogout={handleLogout}
        />

        {/* Feedback Drawer */}
        <FeedbackDrawer
          isOpen={showInfoBubble}
          onClose={() => setShowInfoBubble(false)}
        />

        {/* Top Banner - Same as all pages */}
        <TopBanner
          onMenuClick={() => setShowSidePanel(true)}
          onInfoClick={() => setShowInfoBubble(true)}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-md mt-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            {/* Email Icon */}
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* Main Message */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Please Verify Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We've sent a confirmation link to <strong className="text-gray-900 dark:text-gray-100">{email}</strong>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Click the link in the email to verify your account. You can start using KwizMe after verification.
            </p>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>

            {/* Back to Login Button */}
            <Link
              href="/auth/login"
              className="w-full inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
            >
              Back to Login
            </Link>
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

      {/* Side Panel */}
      <SidePanel
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Feedback Drawer */}
      <FeedbackDrawer
        isOpen={showInfoBubble}
        onClose={() => setShowInfoBubble(false)}
      />

      {/* Top Banner - Same as all pages */}
      <TopBanner
        onMenuClick={() => setShowSidePanel(true)}
        onInfoClick={() => setShowInfoBubble(true)}
      />

      {/* Back Button - Larger for touch */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 mt-24 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 min-h-[44px] text-base md:text-sm font-medium"
        >
          <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Header - Outside card */}
      <div className="relative z-10 w-full max-w-md text-center mx-auto px-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Create Account
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Join KwizMe and start learning</p>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mb-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
                placeholder="Juan Dela Cruz"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
                placeholder="jdc21@up.edu.ph"
              />
            </div>

            {/* Optional Institution Field */}
            <div>
              <label
                htmlFor="institution"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Institution <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                id="institution"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
                placeholder="e.g., UP-Diliman"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Will auto-populate when creating quizzes
              </p>
            </div>

            {/* Optional Program Field */}
            <div>
              <label
                htmlFor="program"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Program <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                id="program"
                type="text"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
                placeholder="e.g., BSCS"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Will auto-populate when creating quizzes
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
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
                Confirm Password
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

            {/* Terms and Privacy Policy Agreement */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <Link
                  href="/legal/terms"
                  target="_blank"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/legal/privacy"
                  target="_blank"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

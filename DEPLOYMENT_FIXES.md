# QuizMe Deployment Issues - Fix Plan

## Overview
This document outlines the issues identified during deployment testing and the plan to address them.

**Deployment URL:** https://quizme-virid.vercel.app/

---

## Additional Issue: Terms of Service & Privacy Policy

### Terms & Privacy Agreement on Signup
**Priority:** HIGH
**Status:** ✅ Completed
**Added:** December 2, 2025

#### Problem
The application handles user-uploaded learning materials (PDFs, documents, images, etc.) without clear legal agreements on:
- User content ownership and intellectual property rights
- File storage and processing
- AI-generated content disclaimers
- Liability protection

#### Solution
**Created comprehensive legal pages and signup integration:**

**Files created:**
- `app/legal/terms/page.tsx` - Terms of Service page
- `app/legal/privacy/page.tsx` - Privacy Policy page

**Files modified:**
- `app/auth/signup/page.tsx` - Added terms agreement checkbox

**Key Features:**

1. **Terms of Service includes:**
   - User content & intellectual property responsibilities
   - File storage disclosure (may store temporarily or permanently)
   - AI-generated content accuracy disclaimer
   - Strong limitation of liability clauses
   - No-sue agreement (where legally permitted)
   - Indemnification clauses
   - Acceptable use policy

2. **Privacy Policy includes:**
   - Data collection disclosure (account info, files, usage data)
   - File storage & processing details
   - Third-party service disclosure (Supabase, Google Gemini, Vercel, FormSubmit)
   - User rights (access, correction, deletion, export)
   - Cookie and local storage usage
   - Children's privacy (13+ age requirement)

3. **Signup Form Integration:**
   - Required checkbox before account creation
   - Links open in new tabs to read full terms
   - Submit button disabled until terms are agreed
   - Validation error if not checked

**Legal Protections Added:**
- ✅ Users confirm they have rights to uploaded materials
- ✅ Disclaimer that AI content may contain errors
- ✅ No warranty / "as is" service provision
- ✅ Limitation of liability
- ✅ User indemnification clauses
- ✅ No-sue agreement
- ✅ File storage disclosure (temporary or permanent)
- ✅ Third-party processing disclosure

**User Experience:**
- Checkbox required on signup form
- Links to full Terms and Privacy pages
- Pages accessible at `/legal/terms` and `/legal/privacy`
- Clean, readable formatting with dark mode support

---

## Issues Identified

### 1. Email Confirmation Link Redirects to localhost:3000
**Priority:** HIGH
**Status:** ✅ Completed (Code Changes Only - Requires Manual Supabase Config)

#### Problem
**User Journey:**
1. User signs up → Receives Supabase email asking for authentication
2. Email confirmation link redirects to `localhost:3000` (broken in production)
3. User returns to app, sees no guidance on what to do next
4. User tries to sign up again → Gets "email already used" error
5. User tries to login → Works (because account was created, just not confirmed)

**Issues:**
- Email confirmation link has wrong URL (localhost:3000 instead of production)
- Email confirmation redirects don't work properly
- Users can login without confirming email (unconfirmed logins are allowed)

#### Root Cause
- Supabase Site URL is not configured to production URL
- Missing `NEXT_PUBLIC_SITE_URL` environment variable in Vercel
- Email confirmation is optional (not enforced), causing confusion

#### Solution
**A. Configure Supabase Settings:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL to: `https://quizme-virid.vercel.app`
3. Add Redirect URLs:
   - `https://quizme-virid.vercel.app/**`
   - `https://quizme-virid.vercel.app/auth/callback`
   - `http://localhost:3000/**` (for local development)

**B. Environment Variables:**
1. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SITE_URL=https://quizme-virid.vercel.app
   ```
2. Add to `.env.example`:
   ```
   # Deployment URL (update for production)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. Add to Vercel environment variables:
   - Variable: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://quizme-virid.vercel.app`
   - Environments: Production, Preview

**C. Update Email Confirmation Flow:**
Keep email confirmation optional (don't enforce), but redirect properly:
1. Email link should redirect to production URL
2. After email confirmation, redirect to login page with success message
3. Users can still login without confirmation

**Files to modify:**
- `.env.local`
- `.env.example`
- Vercel environment variables dashboard (manual configuration)
- Supabase Dashboard → Authentication → URL Configuration (manual configuration)

---

### 2. Signup and Login Pages Missing Info Bubble
**Priority:** MEDIUM
**Status:** ✅ Completed

#### Problem
The info/feedback bubble (blue "i" icon) is missing from signup and login pages but exists on the main app page.

#### Root Cause
The info bubble component (`FeedbackDrawer`) is only rendered in the main `app/page.tsx` and not in auth pages.

#### Solution
**Copy the info bubble implementation from main page to auth pages:**

1. Import `FeedbackDrawer` component in both auth pages
2. Add state management for `showInfoBubble`
3. Add the blue info button to the top bar
4. Render the `FeedbackDrawer` component

**Files to modify:**
- `app/auth/signup/page.tsx`
- `app/auth/login/page.tsx`

**Implementation:**
```typescript
// Add import
import FeedbackDrawer from '@/components/FeedbackDrawer'

// Add state
const [showInfoBubble, setShowInfoBubble] = useState(false)

// Add button to top bar (replace ThemeToggle section)
<div className="flex items-center justify-end gap-2">
  <ThemeToggle />
  <button
    onClick={() => setShowInfoBubble(true)}
    className="bg-blue-600 dark:bg-blue-700 text-white rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
    aria-label="Feedback"
  >
    {/* Info icon SVG */}
  </button>
</div>

// Add FeedbackDrawer component
<FeedbackDrawer
  isOpen={showInfoBubble}
  onClose={() => setShowInfoBubble(false)}
/>
```

---

### 3. Forgot Password Page is Missing
**Priority:** MEDIUM
**Status:** ✅ Completed

#### Problem
There's no forgot password functionality. Users cannot reset their password if they forget it.

#### Root Cause
Feature was never implemented.

#### Solution
**Implement standard Supabase password reset flow:**

**Standard Practice for Supabase Password Reset:**
1. User clicks "Forgot Password?" link on login page
2. Modal opens asking for email
3. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/auth/reset-password' })`
4. Show success message: "Check your email for reset link"
5. User receives email with reset link
6. Link redirects to `/auth/reset-password?token=...` page
7. User enters new password
8. Call `supabase.auth.updateUser({ password: newPassword })`
9. Redirect to login with success message

**Files to modify:**
- `app/auth/login/page.tsx` (add forgot password modal)
- `app/auth/reset-password/page.tsx` (create new file for password reset)

**Implementation A - Login Page Modal:**
```typescript
// In app/auth/login/page.tsx

// Add state
const [showForgotPassword, setShowForgotPassword] = useState(false)
const [resetEmail, setResetEmail] = useState('')
const [resetLoading, setResetLoading] = useState(false)
const [resetMessage, setResetMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

// Add forgot password handler
const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault()
  setResetLoading(true)
  setResetMessage(null)

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    })

    if (error) throw error

    setResetMessage({
      type: 'success',
      text: 'Password reset link sent! Check your email.'
    })

    setTimeout(() => {
      setShowForgotPassword(false)
      setResetMessage(null)
      setResetEmail('')
    }, 3000)
  } catch (err: any) {
    setResetMessage({
      type: 'error',
      text: err.message || 'Failed to send reset email'
    })
  } finally {
    setResetLoading(false)
  }
}

// Add "Forgot Password?" link after password field (before submit button)
<div className="text-right mt-2">
  <button
    type="button"
    onClick={() => setShowForgotPassword(true)}
    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
  >
    Forgot Password?
  </button>
</div>

// Add modal component at the end (after login form, before closing main div)
{showForgotPassword && (
  <>
    {/* Overlay */}
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50"
      onClick={() => setShowForgotPassword(false)}
    />

    {/* Modal */}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full relative">
        <button
          onClick={() => setShowForgotPassword(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Reset Password
        </h2>

        {resetMessage && (
          <div className={`mb-4 p-4 rounded-lg ${
            resetMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {resetMessage.text}
          </div>
        )}

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="jdc21@up.edu.ph"
            />
          </div>

          <button
            type="submit"
            disabled={resetLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            {resetLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  </>
)}
```

**Implementation B - Reset Password Page:**
Create new file: `app/auth/reset-password/page.tsx`

```typescript
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
  const router = useRouter()
  const supabase = createClient()

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="relative z-10 w-full max-w-md">
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
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-3 items-center px-4 lg:px-6 py-2 lg:py-3">
          <div></div>
          <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent text-center">
            QuizMe
          </h1>
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
            {/* Password field with show/hide toggle */}
            {/* Confirm Password field with show/hide toggle */}
            {/* Submit button */}
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
```

---

### 4. QuizMe Banner Not Clickable (No Home Link)
**Priority:** MEDIUM
**Status:** ✅ Completed

#### Problem
The "QuizMe" text in the top bar is not clickable and doesn't navigate back to home.

#### Root Cause
The header title is just text, not a link or button.

#### Solution
**Make the banner clickable on all pages:**

**Files to modify:**
- `app/page.tsx` (main app)
- `app/auth/signup/page.tsx`
- `app/auth/login/page.tsx`

**Implementation:**
```typescript
// Replace static h1 with clickable button/link
<button
  onClick={handleBackToHome}
  className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent text-center cursor-pointer hover:opacity-80 transition-opacity"
>
  QuizMe
</button>

// Or use Link from next/link
<Link href="/">
  <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent text-center cursor-pointer hover:opacity-80 transition-opacity">
    QuizMe
  </h1>
</Link>
```

---

### 5. No User Feedback After Signup
**Priority:** HIGH
**Status:** ✅ Completed

#### Problem
**Current Behavior:**
- After signing up, success screen shows "Account Created! Redirecting you to the app..."
- No mention of email confirmation
- Auto-redirects to home after 2 seconds
- Users are confused about what to do next

**Expected Behavior:**
- Show clear message to check email for verification
- Provide "Back to Login" button (no auto-redirect)
- Users understand they need to verify email before full access

#### Root Cause
The success screen doesn't communicate email verification requirement and auto-redirects too quickly.

#### Solution
**Update the signup success screen to guide users:**

**Files to modify:**
- `app/auth/signup/page.tsx`

**Implementation:**
```typescript
// Update success screen content
if (success) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* ... background pattern ... */}

      {/* Top Bar - Same as signup form */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-3 items-center px-4 lg:px-6 py-2 lg:py-3">
          <div className="flex items-center justify-start">
            <button
              onClick={handleBackToHome}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center shadow transition-colors"
              aria-label="Back to Home"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent text-center">
            QuizMe
          </h1>

          <div className="flex items-center justify-end">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mt-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Email Icon */}
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
            Click the link in the email to verify your account. You can start using QuizMe after verification.
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
```

**Key Changes:**
1. **Remove auto-redirect** - Remove the `setTimeout(() => { router.push('/') }, 2000)` code
2. **Change icon** - Use email icon instead of checkmark
3. **Update message** - Focus on email verification requirement
4. **Add "Back to Login" button** - Let users navigate manually
5. **Keep top bar** - Maintain consistent navigation
6. **No resend button** - Keep it simple (can be added later if needed)

---

### 6. Quiz History - Review Button and Arrow Should Be One Clickable Area
**Priority:** LOW
**Status:** ✅ Completed

#### Problem
In Quiz History, the "Review →" button and the entire session card should act as one clickable area for better UX.

#### Root Cause
Currently the entire card IS clickable (lines 320-346 in QuizHistory.tsx), but the visual design might suggest otherwise.

#### Solution
**Improve visual feedback to make it clear the entire card is clickable:**

**Files to modify:**
- `components/QuizHistory.tsx`

**Implementation:**
```typescript
// The entire session div is already clickable, just improve hover state
<div
  key={session.session_id}
  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer group"
  onClick={(e) => {
    e.stopPropagation();
    handleSessionClick(quiz.quiz_id, session.session_id);
  }}
>
  {/* ... content ... */}
  <div className="text-blue-600 group-hover:text-blue-700 text-sm font-medium group-hover:translate-x-1 transition-transform">
    Review →
  </div>
</div>
```

**Changes:**
1. Add `group` class to parent div
2. Add `group-hover:translate-x-1` to arrow to show movement on hover
3. Add `hover:shadow-md` for better visual feedback
4. Already has proper cursor and hover states

---

### 7. Feedback Doesn't Work on Deployment
**Priority:** HIGH
**Status:** ✅ Completed

#### Problem
Feedback feature fails on deployment. The issue is that the API route uses FormSubmit.co but doesn't dynamically handle the deployment URL - it's hardcoded for localhost:3000.

#### Root Cause
The feedback API route (`app/api/submit-feedback/route.ts`) doesn't use environment-aware URLs. FormSubmit.co needs the correct origin headers and redirect URLs to work properly on different domains.

#### Solution
**Update the feedback API to be deployment-aware:**

FormSubmit.co works fine, it just needs dynamic configuration instead of localhost:3000.

**Files to modify:**
- `app/api/submit-feedback/route.ts`

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get the site URL from environment or request origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';

    console.log('📧 Sending feedback from:', siteUrl);

    // FormSubmit.co doesn't actually need _next for API routes
    // But we can add it for debugging purposes
    // formData.append('_next', `${siteUrl}/feedback-success`);

    // Forward to FormSubmit with proper headers
    const response = await fetch('https://formsubmit.co/my.stationptot@gmail.com', {
      method: 'POST',
      body: formData,
      headers: {
        'Origin': siteUrl,
        'Referer': siteUrl,
      },
    });

    if (response.ok) {
      console.log('✅ Feedback sent successfully');
      return NextResponse.json({ success: true, message: 'Feedback sent successfully' });
    } else {
      const errorText = await response.text();
      console.error('❌ FormSubmit error:', errorText);
      return NextResponse.json({
        success: false,
        message: 'Failed to send feedback',
        error: errorText
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

**Key Changes:**
1. Use `process.env.NEXT_PUBLIC_SITE_URL` as primary source
2. Fallback to `request.headers.get('origin')`
3. Add proper Origin and Referer headers for CORS
4. Add console logging for debugging in production
5. Better error handling with detailed error messages

**Note:** FormSubmit.co should work once proper environment variables are set. If issues persist after deployment, consider alternatives like:
- **Resend** (https://resend.com) - Free tier: 100 emails/day, 3,000/month
- **SendGrid** - Free tier: 100 emails/day
- **AWS SES** - Pay as you go, very cheap

But FormSubmit.co should be sufficient for feedback collection.

---

## Implementation Order

### Phase 1: Critical Fixes (Complete First)
1. ✅ Email confirmation redirect (Issue #1)
2. ✅ No user feedback after signup (Issue #5)
3. ✅ Feedback doesn't work on deployment (Issue #7)

### Phase 2: Important UX Improvements
4. ✅ Missing info bubble on auth pages (Issue #2)
5. ✅ QuizMe banner not clickable (Issue #4)
6. ✅ Forgot password missing (Issue #3)

### Phase 3: Polish
7. ✅ Quiz History review button UX (Issue #6)

---

## Environment Variables Checklist

### Required for Deployment
- [ ] `NEXT_PUBLIC_SITE_URL=https://quizme-virid.vercel.app`
- [x] `NEXT_PUBLIC_SUPABASE_URL=https://iswkywwhrngszlufptdz.supabase.co`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...` (already set)
- [x] `GEMINI_API_KEY=AIza...` (already set)

### Supabase Dashboard Configuration
- [ ] Site URL: `https://quizme-virid.vercel.app`
- [ ] Redirect URLs:
  - [ ] `https://quizme-virid.vercel.app/**`
  - [ ] `http://localhost:3000/**`
- [ ] Email templates updated with correct URLs

---

## Testing Checklist

After implementing fixes, test the following:

### Email Flow
- [ ] Sign up with new email
- [ ] Receive confirmation email
- [ ] Email link redirects to production URL
- [ ] Account is confirmed successfully

### Forgot Password
- [ ] Click "Forgot Password" on login page
- [ ] Enter email and submit
- [ ] Receive reset email
- [ ] Reset link redirects to production URL
- [ ] Can reset password successfully

### Feedback
- [ ] Open feedback drawer from home page
- [ ] Submit feedback
- [ ] Receive success message
- [ ] Email is delivered to my.stationptot@gmail.com

### Navigation
- [ ] Click "QuizMe" banner from any page → returns to home
- [ ] Info bubble appears on signup page
- [ ] Info bubble appears on login page

### Quiz History
- [ ] Click anywhere on a session card → opens review
- [ ] Visual feedback on hover is clear

---

## Notes

- Remember date: 10/17/2001 (per CLAUDE.md instructions)
- Never use port 3000 for testing, use other ports
- Kill test servers after testing
- All changes should be tested locally first before deploying
- Update .env.example with any new environment variables

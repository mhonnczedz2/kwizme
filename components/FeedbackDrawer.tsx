'use client'

import { useState } from 'react'
import { trackFeedbackSubmitted } from '@/lib/analytics'

interface FeedbackDrawerProps {
  isOpen: boolean
  onClose: () => void
  source?: 'post_quiz' | 'error_state' | 'rate_limit' | 'header' | 'support_page'
  defaultType?: 'bug' | 'feature' | 'general' | 'rating'
}

export default function FeedbackDrawer({ isOpen, onClose, source = 'header', defaultType = 'bug' }: FeedbackDrawerProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedbackType, setFeedbackType] = useState(defaultType)
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  const clearErrors = () => {
    if (showError) {
      setShowError(false)
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Clear any previous errors
    setShowError(false)
    setErrorMessage('')

    const form = e.currentTarget
    const formData = new FormData(form)

    // Custom validation
    const name = formData.get('name')?.toString().trim() || ''
    const email = formData.get('email')?.toString().trim() || ''
    const message = formData.get('message')?.toString().trim() || ''

    let hasValidationErrors = false

    // Validate name
    const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement
    if (!name) {
      nameInput.classList.add('border-red-500', 'focus:border-red-500')
      nameInput.classList.remove('border-gray-300', 'focus:border-blue-500')
      hasValidationErrors = true

      // Auto-clear after 2 seconds
      setTimeout(() => {
        nameInput.classList.remove('border-red-500', 'focus:border-red-500')
        nameInput.classList.add('border-gray-300', 'focus:border-blue-500')
      }, 2000)
    }

    // Validate email
    const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      emailInput.classList.add('border-red-500', 'focus:border-red-500')
      emailInput.classList.remove('border-gray-300', 'focus:border-blue-500')
      hasValidationErrors = true

      // Auto-clear after 2 seconds
      setTimeout(() => {
        emailInput.classList.remove('border-red-500', 'focus:border-red-500')
        emailInput.classList.add('border-gray-300', 'focus:border-blue-500')
      }, 2000)
    }

    // Validate rating
    if (rating === null || rating === 0) {
      setShowError(true)
      setErrorMessage('Please provide a rating before submitting your feedback.')
      hasValidationErrors = true

      // Auto-clear rating error after 2 seconds
      setTimeout(() => {
        setShowError(false)
        setErrorMessage('')
      }, 2000)
    }

    // Validate message
    const messageInput = form.querySelector('textarea[name="message"]') as HTMLTextAreaElement
    if (!message) {
      messageInput.classList.add('border-red-500', 'focus:border-red-500')
      messageInput.classList.remove('border-gray-300', 'focus:border-blue-500')
      hasValidationErrors = true

      // Auto-clear after 2 seconds
      setTimeout(() => {
        messageInput.classList.remove('border-red-500', 'focus:border-red-500')
        messageInput.classList.add('border-gray-300', 'focus:border-blue-500')
      }, 2000)
    }

    if (hasValidationErrors) {
      return
    }

    setIsSubmitting(true)

    // Add rating to form data
    formData.set('rating', `${rating}/5 stars`)

    try {
      console.log('📧 Starting feedback submission...')

      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ Feedback sent successfully')
        setShowSuccess(true)

        // Track feedback submission in analytics
        trackFeedbackSubmitted({
          rating: rating || undefined,
          feedbackType: feedbackType as 'bug' | 'feature' | 'general' | 'rating',
          source: source,
          hasText: Boolean(message)
        });

        // Close drawer after showing success message
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
          // Reset form when closing
          form.reset()
          // Reset rating state
          setRating(null)
          setFeedbackType('bug') // Reset to default
          // Reset feedback type to default (Bug Report)
          const typeInput = form.querySelector('input[name="type"]') as HTMLInputElement
          if (typeInput) typeInput.value = 'bug'
          // Reset button styles
          const buttons = form.querySelectorAll('button[type="button"]')
          buttons.forEach((btn, index) => {
            btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent', 'font-bold')
            btn.classList.add('border-2', 'font-medium', 'text-xs')
            if (index === 0) { // Bug Report button
              btn.classList.remove('bg-orange-50', 'border-orange-200', 'text-orange-700', 'font-medium')
              btn.classList.add('bg-orange-500', 'text-white', 'border-transparent', 'font-bold', 'text-xs')
            } else if (index === 1) { // Feature Request button
              btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200')
            } else if (index === 2) { // General Feedback button
              btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200')
            }
          })
        }, 3000)
      } else {
        console.error('❌ Feedback submission failed:', data)
        setShowError(true)
        setErrorMessage(data.message || 'Failed to send feedback. Please try again or email us directly.')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setShowError(true)
      setErrorMessage('An unexpected error occurred. Please try again or email us directly at my.stationptot@gmail.com')
    } finally {
      setIsSubmitting(false)
    }
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

      {/* Feedback Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-gray-50 dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Feedback & Support</h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition p-1"
              aria-label="Close feedback"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {showSuccess ? (
              /* Success Message */
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Feedback Submitted!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Thank you for your feedback. We'll review it and get back to you if needed.
                  </p>
                </div>
              </div>
            ) : (
              /* Feedback Form */
              <>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-4">
                  Have feedback or a feature request? Report a bug below!
                </p>

                {/* Error Message */}
                {showError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-3"
                >
              <input type="hidden" name="_subject" value="QuizMe Feedback" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="rating" value={rating?.toString() || ''} />

              <div>
                <label htmlFor="feedback-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  id="feedback-name"
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  placeholder="Juan Dela Cruz"
                  onInput={(e) => {
                    // Remove error styling when user starts typing
                    e.currentTarget.classList.remove('border-red-500', 'focus:border-red-500');
                    e.currentTarget.classList.add('border-gray-300', 'focus:border-blue-500');
                    clearErrors();
                  }}
                />
              </div>

              <div>
                <label htmlFor="feedback-email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  placeholder="jdc21@up.edu.ph"
                  onInput={(e) => {
                    e.currentTarget.classList.remove('border-red-500', 'focus:border-red-500');
                    e.currentTarget.classList.add('border-gray-300', 'focus:border-blue-500');
                    clearErrors();
                  }}
                />
              </div>

              {/* Star Rating Section */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How would you rate your experience? *
                </label>
                <div className={`flex gap-1 mb-3 justify-center ${
                  showError && rating === null ? 'p-2 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20' : ''
                }`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star)
                        // Clear rating-related errors when user selects a rating
                        if (showError && errorMessage.includes('rating')) {
                          setShowError(false)
                          setErrorMessage('')
                        }
                      }}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="p-1 transition-colors"
                      aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <svg
                        className={`w-6 h-6 transition-colors ${
                          (hoveredRating || rating || 0) >= star
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  ))}
                  {rating && (
                    <button
                      type="button"
                      onClick={() => setRating(null)}
                      className="ml-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Feedback Type *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFeedbackType('bug');
                      const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                      buttons?.forEach(btn => {
                        btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent', 'font-bold');
                        btn.classList.add('border-2', 'font-medium', 'text-xs');
                      });
                      buttons?.forEach(btn => {
                        if (btn.textContent?.includes('Bug')) btn.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                        if (btn.textContent?.includes('Feature')) btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                        if (btn.textContent?.includes('General')) btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                      });
                      e.currentTarget.classList.remove('bg-orange-50', 'border-orange-200', 'text-orange-700', 'font-medium');
                      e.currentTarget.classList.add('bg-orange-500', 'text-white', 'border-transparent', 'font-bold', 'text-xs');
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const typeInput = form.querySelector('input[name="type"]') as HTMLInputElement;
                        if (typeInput) typeInput.value = 'bug';
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-full text-xs font-bold transition-all border-transparent bg-orange-500 text-white shadow-sm"
                  >
                    Bug Report
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFeedbackType('feature');
                      const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                      buttons?.forEach(btn => {
                        btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent', 'font-bold');
                        btn.classList.add('border-2', 'font-medium', 'text-xs');
                      });
                      buttons?.forEach(btn => {
                        if (btn.textContent?.includes('Bug')) btn.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                        if (btn.textContent?.includes('Feature')) btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                        if (btn.textContent?.includes('General')) btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                      });
                      e.currentTarget.classList.remove('bg-blue-50', 'border-blue-200', 'font-medium');
                      e.currentTarget.classList.add('bg-blue-600', 'text-white', 'border-transparent', 'font-bold', 'text-xs');
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const typeInput = form.querySelector('input[name="type"]') as HTMLInputElement;
                        if (typeInput) typeInput.value = 'feature';
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-full text-xs font-medium transition-all border-2 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    Feature Request
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFeedbackType('general');
                      const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                      buttons?.forEach(btn => {
                        btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent', 'font-bold');
                        btn.classList.add('border-2', 'font-medium', 'text-xs');
                      });
                      buttons?.forEach(btn => {
                        if (btn.textContent?.includes('Bug')) btn.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                        if (btn.textContent?.includes('Feature')) btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                        if (btn.textContent?.includes('General')) btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                      });
                      e.currentTarget.classList.remove('bg-green-50', 'border-green-200', 'font-medium');
                      e.currentTarget.classList.add('bg-green-600', 'text-white', 'border-transparent', 'font-bold', 'text-xs');
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const typeInput = form.querySelector('input[name="type"]') as HTMLInputElement;
                        if (typeInput) typeInput.value = 'feedback';
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-full text-xs font-medium transition-all border-2 bg-green-50 text-green-700 border-green-200"
                  >
                    General Feedback
                  </button>
                </div>
                <input type="hidden" name="type" value="bug" />
              </div>

              <div>
                <label htmlFor="feedback-message" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message *
                </label>
                <textarea
                  id="feedback-message"
                  name="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                  placeholder="Describe the issue or your suggestion..."
                  onInput={(e) => {
                    e.currentTarget.classList.remove('border-red-500', 'focus:border-red-500');
                    e.currentTarget.classList.add('border-gray-300', 'focus:border-blue-500');
                    clearErrors();
                  }}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Feedback'
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Or contact directly:</p>
              <a
                href="mailto:my.stationptot@gmail.com"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium break-all"
              >
                my.stationptot@gmail.com
              </a>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

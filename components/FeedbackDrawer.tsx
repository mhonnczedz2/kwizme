'use client'

import { useState } from 'react'

interface FeedbackDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function FeedbackDrawer({ isOpen, onClose }: FeedbackDrawerProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
    setIsSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      // Add timeout to prevent infinite loading (increased for external service)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (result.success) {
        setShowSuccess(true)
        // Close drawer after showing success message
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
          // Reset form when closing
          form.reset()
          // Reset feedback type to default (Bug Report)
          const typeInput = form.querySelector('input[name="type"]') as HTMLInputElement
          if (typeInput) typeInput.value = 'bug'
          // Reset button styles
          const buttons = form.querySelectorAll('button[type="button"]')
          buttons.forEach((btn, index) => {
            btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent')
            btn.classList.add('border-2')
            if (index === 0) { // Bug Report button
              btn.classList.remove('bg-orange-50', 'border-orange-200', 'text-orange-700')
              btn.classList.add('bg-orange-500', 'text-white', 'border-transparent')
            } else if (index === 1) { // Feature Request button
              btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200')
            } else if (index === 2) { // General Feedback button
              btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200')
            }
          })
        }, 2000)
      } else {
        setShowError(true)
        setErrorMessage(result.message || 'Failed to send feedback. Please try again.')
      }
    } catch (error) {
      console.error('Network error submitting feedback:', error)
      setShowError(true)

      if (error instanceof Error && error.name === 'AbortError') {
        setErrorMessage('Request timed out. Please check your connection and try again.')
      } else {
        setErrorMessage('Network error. Please check your connection and try again.')
      }
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
                    Feedback Sent!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Thank you for your feedback. We'll review it shortly.
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
                  required
                  onInput={(e) => {
                    // Remove error styling when user starts typing
                    e.currentTarget.classList.remove('border-red-300');
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
                  required
                  onInput={(e) => {
                    e.currentTarget.classList.remove('border-red-300');
                    clearErrors();
                  }}
                />
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
                      const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                      buttons?.forEach(btn => {
                        btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent');
                        btn.classList.add('border-2');
                      });
                      buttons?.forEach(btn => {
                        if (btn.textContent?.includes('Bug')) btn.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                        if (btn.textContent?.includes('Feature')) btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                        if (btn.textContent?.includes('General')) btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                      });
                      e.currentTarget.classList.remove('bg-orange-50', 'border-orange-200', 'text-orange-700');
                      e.currentTarget.classList.add('bg-orange-500', 'text-white', 'border-transparent');
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const typeInput = form.querySelector('input[name="type"]') as HTMLInputElement;
                        if (typeInput) typeInput.value = 'bug';
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-full text-xs font-medium transition-all border-transparent bg-orange-500 text-white shadow-sm"
                  >
                    Bug Report
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                      buttons?.forEach(btn => {
                        btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent');
                        btn.classList.add('border-2');
                      });
                      buttons?.forEach(btn => {
                        if (btn.textContent?.includes('Bug')) btn.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                        if (btn.textContent?.includes('Feature')) btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                        if (btn.textContent?.includes('General')) btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                      });
                      e.currentTarget.classList.remove('bg-blue-50', 'border-blue-200');
                      e.currentTarget.classList.add('bg-blue-600', 'text-white', 'border-transparent');
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
                      const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                      buttons?.forEach(btn => {
                        btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent');
                        btn.classList.add('border-2');
                      });
                      buttons?.forEach(btn => {
                        if (btn.textContent?.includes('Bug')) btn.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                        if (btn.textContent?.includes('Feature')) btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                        if (btn.textContent?.includes('General')) btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                      });
                      e.currentTarget.classList.remove('bg-green-50', 'border-green-200');
                      e.currentTarget.classList.add('bg-green-600', 'text-white', 'border-transparent');
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
                <input type="hidden" name="type" value="bug" required />
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
                  required
                  onInput={(e) => {
                    e.currentTarget.classList.remove('border-red-300');
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

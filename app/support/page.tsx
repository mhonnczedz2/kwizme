'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import TopBanner from '@/components/TopBanner'
import SidePanel from '@/components/SidePanel'
import FeedbackDrawer from '@/components/FeedbackDrawer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'general' | 'account' | 'technical' | 'billing'
}

const faqData: FAQItem[] = [
  // General Questions
  {
    id: 'what-is-quizme',
    question: 'What is QuizMe?',
    answer: 'QuizMe is an AI-powered quiz generation tool that helps students create practice quizzes from their learning materials. Simply upload your study materials (PDFs, documents, etc.) and get instant quizzes to test your knowledge.',
    category: 'general'
  },
  {
    id: 'how-does-it-work',
    question: 'How does QuizMe work?',
    answer: 'Upload your study materials, choose your quiz preferences (difficulty, number of questions, etc.), and our AI will generate relevant quiz questions based on your content. You can then take the quiz and track your progress over time.',
    category: 'general'
  },
  {
    id: 'supported-file-types',
    question: 'What file types are supported?',
    answer: 'QuizMe supports PDF documents, Word documents (.docx), PowerPoint presentations (.pptx), and plain text files (.txt). We\'re working on adding support for more file types.',
    category: 'general'
  },
  {
    id: 'quiz-accuracy',
    question: 'How accurate are the generated quizzes?',
    answer: 'Our AI is trained to create relevant and accurate questions based on your content. However, we recommend reviewing the questions and using them as a study aid rather than the sole assessment method.',
    category: 'general'
  },

  // Account Questions
  {
    id: 'create-account',
    question: 'Do I need to create an account?',
    answer: 'No! You can use QuizMe without creating an account. However, creating a free account allows you to save your quizzes, track your progress, and access additional features.',
    category: 'account'
  },
  {
    id: 'account-benefits',
    question: 'What are the benefits of creating an account?',
    answer: 'With an account, you can save unlimited quizzes, track your learning progress, review past quiz sessions, sync data across devices, and get personalized learning insights.',
    category: 'account'
  },
  {
    id: 'forgot-password',
    question: 'I forgot my password. How can I reset it?',
    answer: 'Go to the login page and click "Forgot Password". Enter your email address and we\'ll send you a reset link. Check your spam folder if you don\'t see the email.',
    category: 'account'
  },
  {
    id: 'data-privacy',
    question: 'Is my data safe and private?',
    answer: 'Yes! We take your privacy seriously. Your uploaded files are processed securely and not stored permanently. Quiz data is encrypted and only accessible to you. Read our Privacy Policy for full details.',
    category: 'account'
  },

  // Technical Questions
  {
    id: 'file-size-limit',
    question: 'What is the file size limit?',
    answer: 'Currently, individual files can be up to 10MB. If your file is larger, try splitting it into smaller sections or converting it to a more compressed format.',
    category: 'technical'
  },
  {
    id: 'quiz-not-generating',
    question: 'My quiz is not generating. What should I do?',
    answer: 'Try refreshing the page and uploading your file again. Make sure your file contains readable text content. If the problem persists, contact us through the feedback form.',
    category: 'technical'
  },
  {
    id: 'browser-compatibility',
    question: 'Which browsers are supported?',
    answer: 'QuizMe works best on modern browsers including Chrome, Firefox, Safari, and Edge. Make sure you have JavaScript enabled for the best experience.',
    category: 'technical'
  },
  {
    id: 'mobile-support',
    question: 'Can I use QuizMe on mobile devices?',
    answer: 'Yes! QuizMe is fully responsive and works great on smartphones and tablets. You can also install it as a Progressive Web App (PWA) for an app-like experience.\n\n📱 How to install QuizMe as an app:\n\n• iPhone/iPad: Open QuizMe in Safari, tap the Share button, then tap "Add to Home Screen"\n• Android: Open QuizMe in Chrome, tap the menu (3 dots), then tap "Add to Home screen" or look for the "Install app" prompt\n• Desktop: Look for the install icon in your browser\'s address bar, or check the browser menu for "Install QuizMe"\n\nOnce installed, QuizMe will work like a native app with faster loading, offline capabilities, and easy access from your home screen!',
    category: 'technical'
  },

  // Billing Questions
  {
    id: 'is-it-free',
    question: 'Is QuizMe free to use?',
    answer: 'Yes! QuizMe is completely free to use. We believe education should be accessible to everyone. There are no hidden fees or premium tiers.',
    category: 'billing'
  },
  {
    id: 'usage-limits',
    question: 'Are there any usage limits?',
    answer: 'We have reasonable usage limits in place to ensure fair access for all users. If you need higher limits for institutional use, please contact us.',
    category: 'billing'
  }
]

export default function SupportPage() {
  const [user, setUser] = useState<User | null>(null)
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
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

  // Change grid direction randomly
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

    const intervalId = setInterval(changeDirection, 8000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  // Filter FAQs based on category and search
  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  const categories = [
    { id: 'all', label: 'All Questions', icon: '📚' },
    { id: 'general', label: 'General', icon: '❓' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'technical', label: 'Technical', icon: '🔧' },
    { id: 'billing', label: 'Billing', icon: '💳' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        source="support_page"
        defaultType="general"
      />

      {/* Top Banner */}
      <TopBanner
        onMenuClick={() => setShowSidePanel(true)}
        onInfoClick={() => setShowFeedback(true)}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Help & Support
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Find answers to common questions and get help with QuizMe
          </p>

        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {category.id === 'all' ? faqData.length : faqData.filter(faq => faq.category === category.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 pr-4">
                    {faq.question}
                  </h3>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${
                      openFAQ === faq.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openFAQ === faq.id && (
                  <div className="px-6 pb-4">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search or contact us directly
              </p>
              <button
                onClick={() => setShowFeedback(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium rounded-lg transition-colors"
              >
                Ask a Question
              </button>
            </div>
          )}
        </div>

        {/* Additional Help Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Still need help?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help. Send us a message and we'll get back to you as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowFeedback(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
            >
              Send Feedback
            </button>
            <Link
              href="/"
              className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back to QuizMe
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
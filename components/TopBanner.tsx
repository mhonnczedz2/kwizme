'use client'

import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

interface TopBannerProps {
  onMenuClick: () => void
  onInfoClick: () => void
}

export default function TopBanner({ onMenuClick, onInfoClick }: TopBannerProps) {
  const router = useRouter()

  const handleQuizMeClick = () => {
    console.log('🔵 QuizMe banner clicked - navigating to /')
    // Use router.push for client-side navigation
    router.push('/')
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="grid grid-cols-3 items-center px-4 lg:px-6 py-2 lg:py-3">
        {/* Left: Menu Button */}
        <div className="flex items-center justify-start">
          <button
            onClick={onMenuClick}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center shadow transition-colors"
            aria-label="Menu"
          >
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Center: QuizMe Title */}
        <button
          onClick={handleQuizMeClick}
          className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent text-center cursor-pointer hover:opacity-80 transition-opacity"
        >
          QuizMe
        </button>

        {/* Right: Theme Toggle + Info Button */}
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          <button
            onClick={onInfoClick}
            className="bg-blue-600 dark:bg-blue-700 text-white rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            aria-label="Feedback"
          >
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

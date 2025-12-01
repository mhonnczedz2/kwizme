'use client';

import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

interface QuizResultsProps {
  score: number;
  total: number;
  quizTitle: string;
  onTryAgain: () => void;
  onBackHome: () => void;
}

export default function QuizResults({ score, total, quizTitle, onTryAgain, onBackHome }: QuizResultsProps) {
  const percentage = Math.round((score / total) * 100);

  // Keyboard shortcuts: R to retake, H or Esc for home
  useKeyboardShortcuts({
    onNext: onTryAgain, // R or → to retake
    onHint: onBackHome, // H for home
    onEscape: onBackHome, // Esc for home
  });

  const getGrade = () => {
    if (percentage >= 90) return { letter: 'A', color: 'text-green-600', message: 'Outstanding!' };
    if (percentage >= 80) return { letter: 'B', color: 'text-blue-600', message: 'Great Job!' };
    if (percentage >= 70) return { letter: 'C', color: 'text-yellow-600', message: 'Good Work!' };
    if (percentage >= 60) return { letter: 'D', color: 'text-orange-600', message: 'Keep Practicing!' };
    return { letter: 'F', color: 'text-red-600', message: 'Try Again!' };
  };

  const grade = getGrade();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 pt-8 md:pt-10">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 text-center">
        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Quiz Completed!
        </h2>

        {/* Score */}
        <div className="mb-6 md:mb-8">
          <div className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {score} / {total}
          </div>
          <div className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
            {percentage}% Correct
          </div>
        </div>

        {/* Quiz Info */}
        <div className="mb-6 md:mb-8 p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Quiz Completed:</p>
          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm md:text-base">{quizTitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 md:mb-8">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 md:h-4 overflow-hidden">
            <div
              className={`h-3 md:h-4 transition-all ${
                percentage >= 70 ? 'bg-green-500 dark:bg-green-400' : percentage >= 60 ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-red-500 dark:bg-red-400'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Stats Breakdown */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
          <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{score}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Correct</div>
          </div>
          <div className="p-3 md:p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">{total - score}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Incorrect</div>
          </div>
          <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{total}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onTryAgain}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium min-h-[44px]"
          >
            Try Again
          </button>
          <button
            onClick={onBackHome}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium min-h-[44px]"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

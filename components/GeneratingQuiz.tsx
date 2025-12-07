'use client';

import { useState, useEffect } from 'react';

interface GeneratingQuizProps {
  error?: string | null;
  onRetry?: () => void;
  onReportIssue?: () => void;
}

interface Stage {
  emoji: string;
  message: string;
  duration: number; // in milliseconds
}

const stages: Stage[] = [
  { emoji: '📄', message: 'Reading your file...', duration: 2000 },
  { emoji: '🧠', message: 'Analyzing content...', duration: 3000 },
  { emoji: '❓', message: 'Generating questions...', duration: 3000 },
  { emoji: '✨', message: 'Almost ready...', duration: 2000 },
];

export default function GeneratingQuiz({ error, onRetry, onReportIssue }: GeneratingQuizProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (error) return; // Don't run progress simulation if there's an error

    let intervalId: NodeJS.Timeout;
    let stageIntervalId: NodeJS.Timeout;
    let cleanupTimeout: NodeJS.Timeout;
    let isActive = true;

    const updateProgress = () => {
      if (!isActive) return;

      setProgress(currentProgress => {
        if (!isActive || currentProgress >= 95) return currentProgress;

        // Sometimes pause (10% chance) to simulate processing
        if (Math.random() < 0.1) {
          return currentProgress;
        }

        // Generate random increment between 0.5% and 4%
        const baseIncrement = Math.random() * 3.5 + 0.5;

        // Add occasional bursts of faster progress (20% chance)
        const burstMultiplier = Math.random() < 0.2 ? 1.8 : 1;
        const randomIncrement = baseIncrement * burstMultiplier;

        // Slow down as we approach 95% (add resistance)
        const slowdownFactor = currentProgress > 80 ? 0.25 : currentProgress > 60 ? 0.6 : 1;
        const adjustedProgress = currentProgress + (randomIncrement * slowdownFactor);

        // Cap at 95% until actual completion
        return Math.min(adjustedProgress, 95);
      });

      // Schedule next update with random interval, only if still active
      if (isActive) {
        const nextInterval = 150 + Math.random() * 400; // 150-550ms
        intervalId = setTimeout(updateProgress, nextInterval);
      }
    };

    // Start the progress updates
    updateProgress();

    // Change stage based on progress percentage
    stageIntervalId = setInterval(() => {
      if (!isActive) return;

      setProgress(currentProgress => {
        if (currentProgress < 20) setCurrentStageIndex(0);
        else if (currentProgress < 45) setCurrentStageIndex(1);
        else if (currentProgress < 75) setCurrentStageIndex(2);
        else setCurrentStageIndex(3);
        return currentProgress;
      });
    }, 500);

    // Clean up after total expected duration
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    cleanupTimeout = setTimeout(() => {
      isActive = false;
      clearTimeout(intervalId);
      clearInterval(stageIntervalId);
    }, totalDuration);

    return () => {
      isActive = false;
      clearTimeout(intervalId);
      clearInterval(stageIntervalId);
      clearTimeout(cleanupTimeout);
    };
  }, [error]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-4">
              <svg
                className="w-16 h-16 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Oops! Something went wrong
          </h2>

          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 text-center">
              {error === 'PDF_PARSE_ERROR' && "Couldn't read your file. Try another one?"}
              {error === 'API_ERROR' && "AI service is unavailable. Try again in a moment."}
              {error === 'RATE_LIMIT' && "Too many quizzes! Please wait before trying again."}
              {error.startsWith('RATE_LIMIT:') && error.replace('RATE_LIMIT:', '').trim()}
              {!['PDF_PARSE_ERROR', 'API_ERROR', 'RATE_LIMIT'].includes(error) && !error.startsWith('RATE_LIMIT:') && error}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {onRetry && error !== 'RATE_LIMIT' && !error.startsWith('RATE_LIMIT:') && (
              <button
                onClick={onRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go Back
            </button>

            {onReportIssue ? (
              <button
                onClick={onReportIssue}
                className="text-center text-sm text-blue-600 hover:text-blue-700 mt-2 font-medium underline"
              >
                Report Issue
              </button>
            ) : (
              <a
                href="https://github.com/yourusername/quizme/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                Report Issue
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStage = stages[currentStageIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>

            {/* Inner pulsing circle */}
            <div className="relative bg-blue-100 rounded-full p-6 animate-pulse">
              <span className="text-5xl" role="img" aria-label="generating">
                {currentStage.emoji}
              </span>
            </div>
          </div>
        </div>

        {/* Stage Message */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Generating Your Quiz
        </h2>

        <p className="text-lg text-gray-600 text-center mb-6 min-h-[28px] transition-all duration-300">
          {currentStage.message}
        </p>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>

        {/* Progress Percentage */}
        <p className="text-center text-sm text-gray-500 font-medium">
          {Math.round(progress)}%
        </p>

        {/* Stage Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {stages.map((stage, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentStageIndex
                  ? 'bg-blue-600 scale-125'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Helpful Tip */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-gray-600 text-center">
            💡 This can take up to 60 seconds. Hang tight!
          </p>
        </div>
      </div>

      {/* Add shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

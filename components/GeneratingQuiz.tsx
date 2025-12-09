'use client';

import { useState, useEffect } from 'react';

export interface ErrorDetails {
  error: string;
  code?: string;
  reference?: string;
  timestamp?: string;
  details?: string;
  suggestion?: string;
}

interface GeneratingQuizProps {
  error?: string | ErrorDetails | null;
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

// Parse error prop into structured format
function parseError(error: string | ErrorDetails | null | undefined): ErrorDetails | null {
  if (!error) return null;

  if (typeof error === 'object') {
    return error;
  }

  // Handle legacy string errors
  if (error.startsWith('RATE_LIMIT:')) {
    return {
      error: 'Daily limit reached',
      code: 'RATE_LIMIT_EXCEEDED',
      details: error.replace('RATE_LIMIT:', '').trim(),
      suggestion: 'Wait until the limit resets or contact us!'
    };
  }

  if (error === 'RATE_LIMIT') {
    return {
      error: 'Daily limit reached',
      code: 'RATE_LIMIT_EXCEEDED',
      suggestion: 'Wait until the limit resets or contact us!'
    };
  }

  if (error === 'PDF_PARSE_ERROR') {
    return {
      error: "Couldn't read your file",
      code: 'PDF_PARSE_ERROR',
      suggestion: 'Try uploading a different file or a clearer scan.'
    };
  }

  if (error === 'API_ERROR') {
    return {
      error: 'AI service unavailable',
      code: 'AI_SERVICE_ERROR',
      suggestion: 'Please wait a moment and try again.'
    };
  }

  // Generic error
  return {
    error: error,
    code: 'UNKNOWN_ERROR'
  };
}

function getErrorIcon(code?: string): string {
  switch (code) {
    case 'RATE_LIMIT_EXCEEDED':
      return '⏱️';
    case 'FILE_TOO_LARGE':
    case 'UNSUPPORTED_FILE_TYPE':
    case 'NO_FILE_PROVIDED':
    case 'PDF_PARSE_ERROR':
      return '📄';
    case 'AI_SERVICE_ERROR':
    case 'API_KEY_ERROR':
      return '🤖';
    case 'QUIZ_VALIDATION_FAILED':
      return '❌';
    default:
      return '⚠️';
  }
}

export default function GeneratingQuiz({ error, onRetry, onReportIssue }: GeneratingQuizProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const parsedError = parseError(error);
  const isRateLimitError = parsedError?.code === 'RATE_LIMIT_EXCEEDED';

  const copyErrorDetails = () => {
    if (!parsedError) return;

    const details = [
      `Error: ${parsedError.error}`,
      parsedError.code ? `Code: ${parsedError.code}` : '',
      parsedError.reference ? `Reference: ${parsedError.reference}` : '',
      parsedError.details ? `Details: ${parsedError.details}` : '',
      parsedError.timestamp ? `Time: ${parsedError.timestamp}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(details).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
              <span className="text-5xl" role="img" aria-label="error">
                {getErrorIcon(parsedError?.code)}
              </span>
            </div>
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {parsedError?.error || 'Something went wrong'}
          </h2>

          {/* Error Code Badge */}
          {parsedError?.code && (
            <div className="flex justify-center mb-4">
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {parsedError.code}
              </span>
            </div>
          )}

          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            {parsedError?.details && (
              <p className="text-sm text-gray-700 text-center mb-2">
                {parsedError.details}
              </p>
            )}
            {parsedError?.suggestion && (
              <p className="text-sm text-gray-600 text-center italic">
                {parsedError.suggestion}
              </p>
            )}
            {!parsedError?.details && !parsedError?.suggestion && (
              <p className="text-sm text-red-800 text-center">
                An unexpected error occurred. Please try again.
              </p>
            )}
          </div>

          {/* Reference Code for Reporting */}
          {parsedError?.reference && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 text-center mb-1">Reference Code (for support)</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-sm font-mono text-gray-700 bg-white px-2 py-1 rounded border">
                  {parsedError.reference}
                </code>
                <button
                  onClick={copyErrorDetails}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {onRetry && !isRateLimitError && (
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
                href="https://github.com/mhonnczedz2/kwizme/issues"
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
            💡 This can take up to 3 minutes. Hang tight!
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

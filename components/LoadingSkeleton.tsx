'use client';

interface LoadingSkeletonProps {
  variant?: 'quiz-card' | 'quiz-grid' | 'history-list' | 'question';
  count?: number;
}

export default function LoadingSkeleton({ variant = 'quiz-card', count = 1 }: LoadingSkeletonProps) {
  if (variant === 'quiz-grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <QuizCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (variant === 'history-list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <HistoryItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (variant === 'question') {
    return <QuestionSkeleton />;
  }

  // Default: single quiz card
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <QuizCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Quiz Card Skeleton - for quiz browser grid
function QuizCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
      {/* Title skeleton */}
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>

      {/* Metadata skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>

      {/* Stats skeleton */}
      <div className="flex gap-4 mb-4">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>

      {/* Button skeletons */}
      <div className="flex gap-2 mt-6">
        <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-10"></div>
      </div>
    </div>
  );
}

// History Item Skeleton - for quiz history list
function HistoryItemSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left side - Quiz info */}
        <div className="flex-1 space-y-3">
          {/* Quiz title */}
          <div className="h-6 bg-gray-200 rounded w-3/4 md:w-1/2"></div>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>

          {/* Score badge */}
          <div className="h-8 bg-gray-200 rounded-full w-24"></div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded-lg w-28"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );
}

// Question Skeleton - for quiz display
function QuestionSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 animate-pulse">
      {/* Question number */}
      <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>

      {/* Question text */}
      <div className="space-y-2 mb-6">
        <div className="h-6 bg-gray-200 rounded w-full"></div>
        <div className="h-6 bg-gray-200 rounded w-4/5"></div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Bottom buttons */}
      <div className="flex justify-between mt-6">
        <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
      </div>
    </div>
  );
}

// Shimmer effect for better visual feedback
export function ShimmerEffect() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
  );
}

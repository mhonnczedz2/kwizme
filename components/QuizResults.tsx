'use client';

interface QuizResultsProps {
  score: number;
  total: number;
  quizTitle: string;
  onTryAgain: () => void;
  onBackHome: () => void;
}

export default function QuizResults({ score, total, quizTitle, onTryAgain, onBackHome }: QuizResultsProps) {
  const percentage = Math.round((score / total) * 100);

  const getGrade = () => {
    if (percentage >= 90) return { letter: 'A', color: 'text-green-600', message: 'Outstanding!' };
    if (percentage >= 80) return { letter: 'B', color: 'text-blue-600', message: 'Great Job!' };
    if (percentage >= 70) return { letter: 'C', color: 'text-yellow-600', message: 'Good Work!' };
    if (percentage >= 60) return { letter: 'D', color: 'text-orange-600', message: 'Keep Practicing!' };
    return { letter: 'F', color: 'text-red-600', message: 'Try Again!' };
  };

  const grade = getGrade();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 text-center">
        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Quiz Completed!
        </h2>

        {/* Score */}
        <div className="mb-6 md:mb-8">
          <div className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            {score} / {total}
          </div>
          <div className="text-lg md:text-xl text-gray-600">
            {percentage}% Correct
          </div>
        </div>

        {/* Quiz Info */}
        <div className="mb-6 md:mb-8 p-3 md:p-4 bg-gray-50 rounded-lg">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Quiz Completed:</p>
          <p className="font-semibold text-gray-800 text-sm md:text-base">{quizTitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 md:mb-8">
          <div className="bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
            <div
              className={`h-3 md:h-4 transition-all ${
                percentage >= 70 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Stats Breakdown */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
          <div className="p-3 md:p-4 bg-green-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-green-600">{score}</div>
            <div className="text-xs text-gray-600">Correct</div>
          </div>
          <div className="p-3 md:p-4 bg-red-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-red-600">{total - score}</div>
            <div className="text-xs text-gray-600">Incorrect</div>
          </div>
          <div className="p-3 md:p-4 bg-blue-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-blue-600">{total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onTryAgain}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
          >
            Try Again
          </button>
          <button
            onClick={onBackHome}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium min-h-[44px]"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

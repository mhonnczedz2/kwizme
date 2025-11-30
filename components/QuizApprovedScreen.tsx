'use client';

interface QuizApprovedScreenProps {
  quizTitle: string;
  questionCount: number;
  onTakeQuiz: () => void;
  onGenerateNew: () => void;
  onCheckQuizzes: () => void;
}

export default function QuizApprovedScreen({
  quizTitle,
  questionCount,
  onTakeQuiz,
  onGenerateNew,
  onCheckQuizzes
}: QuizApprovedScreenProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 pt-8 md:pt-10">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Success Message */}
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Quiz Saved Successfully!
        </h2>

        <p className="text-lg text-gray-600 mb-2">
          {quizTitle}
        </p>

        <p className="text-sm text-gray-500 mb-8">
          {questionCount} question{questionCount !== 1 ? 's' : ''} ready to practice
        </p>

        {/* What's Next Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            What would you like to do next?
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Take Quiz Button */}
            <button
              onClick={onTakeQuiz}
              className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-all hover:shadow-lg text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-semibold mb-1">Take This Quiz Now</h4>
                  <p className="text-sm text-blue-100">
                    Start practicing with the questions you just created
                  </p>
                </div>
                <svg className="w-8 h-8 text-blue-200 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>

            {/* Generate New Quiz Button */}
            <button
              onClick={onGenerateNew}
              className="bg-indigo-100 text-indigo-900 rounded-lg p-6 hover:bg-indigo-200 transition-all hover:shadow-lg text-left group border-2 border-indigo-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-semibold mb-1">Generate Another Quiz</h4>
                  <p className="text-sm text-indigo-700">
                    Upload new learning materials and create more practice questions
                  </p>
                </div>
                <svg className="w-8 h-8 text-indigo-400 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </button>

            {/* Check Available Quizzes Button */}
            <button
              onClick={onCheckQuizzes}
              className="bg-purple-100 text-purple-900 rounded-lg p-6 hover:bg-purple-200 transition-all hover:shadow-lg text-left group border-2 border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-semibold mb-1">Browse Available Quizzes</h4>
                  <p className="text-sm text-purple-700">
                    View all your saved quizzes and pick one to practice
                  </p>
                </div>
                <svg className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

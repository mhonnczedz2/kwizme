'use client';

import { QuizGenerationResponse, AnswerRecord } from '@/lib/db/types';

interface QuizReviewProps {
  quizData: QuizGenerationResponse;
  answers: AnswerRecord[];
  sessionScore: { correct: number; total: number };
  onRetake: () => void;
  onBack: () => void;
}

export default function QuizReview({
  quizData,
  answers,
  sessionScore,
  onRetake,
  onBack
}: QuizReviewProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const scorePercentage = (sessionScore.correct / sessionScore.total) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to History
        </button>
        <div className="text-sm font-semibold text-gray-700">
          Final Score: {sessionScore.correct} / {sessionScore.total} ({scorePercentage.toFixed(1)}%)
        </div>
      </div>

      {/* Quiz Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {quizData.quiz_title}
        </h1>
        <p className="text-gray-600">Review Your Answers</p>
      </div>

      {/* Questions Review */}
      <div className="space-y-6 mb-8">
        {quizData.questions.map((question, qIndex) => {
          // Find the answer record for this question
          // Note: answer_records use question_id which corresponds to database IDs
          // We need to match by the question order since we're iterating through quizData.questions
          const answerRecord = answers[qIndex];
          const selectedAnswerIndex = answerRecord?.selected_answer_index ?? -1;
          const selectedAnswer = selectedAnswerIndex >= 0 ? question.options[selectedAnswerIndex] : null;
          const isCorrect = answerRecord?.is_correct ?? false;

          return (
            <div
              key={qIndex}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                isCorrect ? 'border-green-200' : 'border-red-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-gray-700">
                    Question {qIndex + 1}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty.toUpperCase()}
                  </span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isCorrect ? (
                    <>
                      <span className="text-lg">✓</span>
                      <span className="text-sm font-medium">Correct</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">✗</span>
                      <span className="text-sm font-medium">Incorrect</span>
                    </>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {question.question}
              </h3>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {question.options.map((option, optIndex) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === question.correct_answer;

                  let optionClass = "w-full text-left p-3 rounded-lg border-2 ";
                  if (isCorrectAnswer) {
                    optionClass += "border-green-500 bg-green-50";
                  } else if (isSelected && !isCorrect) {
                    optionClass += "border-red-500 bg-red-50";
                  } else {
                    optionClass += "border-gray-200 bg-gray-50";
                  }

                  return (
                    <div key={optIndex} className={optionClass}>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-600">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className="flex-1">{option}</span>
                        {isCorrectAnswer && (
                          <span className="text-green-600 font-semibold">✓ Correct Answer</span>
                        )}
                        {isSelected && !isCorrectAnswer && (
                          <span className="text-red-600 font-semibold">Your Answer</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-800">Explanation:</h4>
                <p className="text-gray-700 mb-2">{question.explanation}</p>
                {question.citation && (
                  <p className="text-xs text-gray-500 italic border-t border-gray-300 pt-2 mt-2">
                    📄 Source: {question.citation}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Retake Button */}
      <div className="text-center pb-8">
        <button
          onClick={onRetake}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          Retake Quiz
        </button>
      </div>
    </div>
  );
}

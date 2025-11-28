'use client';

import { useState, useEffect } from 'react';
import { Quiz } from '@/lib/db/types';
import { getAllQuizzes, getQuizById, deleteQuiz } from '@/lib/db/quiz-storage';
import { QuizGenerationResponse } from '@/lib/db/types';

interface QuizHistoryProps {
  onSelectQuiz: (quiz: QuizGenerationResponse) => void;
  onBack: () => void;
}

export default function QuizHistory({ onSelectQuiz, onBack }: QuizHistoryProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const allQuizzes = await getAllQuizzes();
      setQuizzes(allQuizzes);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizClick = async (quizId: string) => {
    try {
      const quiz = await getQuizById(quizId);
      if (quiz) {
        onSelectQuiz(quiz);
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert('Failed to load quiz. Please try again.');
    }
  };

  const handleDeleteQuiz = async (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent quiz from being selected

    if (!confirm('Are you sure you want to delete this quiz?')) {
      return;
    }

    try {
      await deleteQuiz(quizId);
      await loadQuizzes(); // Reload the list
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert('Failed to delete quiz. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz History</h1>
          <p className="text-gray-600 mt-1">Review your past quizzes</p>
        </div>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading quizzes...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && quizzes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Quizzes Yet</h2>
          <p className="text-gray-600 mb-6">Generate your first quiz to see it here</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Quiz
          </button>
        </div>
      )}

      {/* Quiz List */}
      {!isLoading && quizzes.length > 0 && (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.quiz_id}
              onClick={() => handleQuizClick(quiz.quiz_id)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {quiz.pdf_filename}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(quiz.difficulty_level)}`}>
                      {quiz.difficulty_level.toUpperCase()}
                    </span>
                  </div>

                  {quiz.topic && (
                    <p className="text-sm text-gray-600 mb-1">
                      📖 Topic: {quiz.topic}
                    </p>
                  )}

                  {quiz.course && (
                    <p className="text-sm text-gray-600 mb-1">
                      🎓 Course: {quiz.course_code ? `${quiz.course_code} - ` : ''}{quiz.course}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Created: {formatDate(quiz.created_at)}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDeleteQuiz(quiz.quiz_id, e)}
                  className="ml-4 text-red-500 hover:text-red-700 p-2"
                  title="Delete quiz"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

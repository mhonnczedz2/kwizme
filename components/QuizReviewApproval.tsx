'use client';

import { useState } from 'react';
import { QuizGenerationResponse } from '@/lib/db/types';
import QuestionEditModal from './QuestionEditModal';

interface QuizReviewApprovalProps {
  quizData: QuizGenerationResponse;
  onApproveAndSave: (finalQuizData: QuizGenerationResponse) => void;
  onCancel: () => void;
}

export default function QuizReviewApproval({
  quizData,
  onApproveAndSave,
  onCancel
}: QuizReviewApprovalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [editedQuizData, setEditedQuizData] = useState<QuizGenerationResponse>(quizData);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApproveAllConfirm, setShowApproveAllConfirm] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const currentQuestion = editedQuizData.questions[currentQuestionIndex];
  const totalQuestions = editedQuizData.questions.length;

  const handleQuestionUpdate = async (updates: {
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    citation?: string;
    hint?: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => {
    // Update the question in local state
    const updatedQuestions = [...editedQuizData.questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      question: updates.question_text,
      options: updates.options,
      correct_answer: updates.correct_answer,
      explanation: updates.explanation,
      citation: updates.citation,
      hint: updates.hint,
      difficulty: updates.difficulty
    };

    setEditedQuizData({
      ...editedQuizData,
      questions: updatedQuestions
    });

    setEditingQuestionId(null);
  };

  const handleQuestionDelete = async () => {
    if (totalQuestions <= 1) {
      alert('You must have at least 1 question.');
      return;
    }

    const updatedQuestions = editedQuizData.questions.filter((_, idx) => idx !== currentQuestionIndex);
    setEditedQuizData({
      ...editedQuizData,
      questions: updatedQuestions
    });

    // Adjust current index if needed
    if (currentQuestionIndex >= updatedQuestions.length) {
      setCurrentQuestionIndex(updatedQuestions.length - 1);
    }

    setEditingQuestionId(null);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      question: 'New question - click edit to customize',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: 'Option A',
      explanation: 'Add your explanation here',
      hint: '',
      citation: '',
      difficulty: 'medium'
    };

    setEditedQuizData({
      ...editedQuizData,
      questions: [...editedQuizData.questions, newQuestion]
    });

    setShowAddQuestion(false);
    // Navigate to the new question
    setCurrentQuestionIndex(editedQuizData.questions.length);
  };

  const handleApproveAll = () => {
    setShowApproveAllConfirm(false);
    onApproveAndSave(editedQuizData);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onCancel}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 min-h-[44px] text-base md:text-sm font-medium"
        >
          ← Cancel
        </button>
      </div>

      {/* Title - Responsive */}
      <div className="mb-6 md:mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Review & Approve Questions
        </h1>
        <p className="text-sm md:text-base text-gray-600">Review each question before saving your quiz</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddQuestion(true)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium min-h-[44px]"
            >
              + Add Question
            </button>
          </div>
        </div>
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card - Responsive padding */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 border-2 border-gray-200">
        {/* Question Header - Stack buttons on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <span className={`px-3 py-1 rounded text-xs font-medium self-start ${getDifficultyColor(currentQuestion.difficulty)}`}>
            {currentQuestion.difficulty.toUpperCase()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingQuestionId(currentQuestionIndex)}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium min-h-[44px]"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium min-h-[44px]"
              disabled={totalQuestions <= 1}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Question Text - Responsive sizing */}
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">
          {currentQuestion.question}
        </h3>

        {/* Options - Touch-friendly */}
        <div className="space-y-2 md:space-y-2 mb-4">
          {currentQuestion.options.map((option, idx) => {
            const isCorrect = option === currentQuestion.correct_answer;
            return (
              <div
                key={idx}
                className={`p-3 md:p-3 rounded-lg border-2 ${
                  isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-600">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span className="flex-1 text-gray-900 text-sm md:text-base">{option}</span>
                  {isCorrect && (
                    <span className="text-green-600 font-semibold text-sm">✓ Correct</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation - Responsive padding and text */}
        <div className="p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg mb-3">
          <h4 className="font-semibold mb-2 text-blue-900 text-sm md:text-base">Explanation:</h4>
          <p className="text-blue-800 text-sm md:text-base">{currentQuestion.explanation}</p>
        </div>

        {/* Hint (if exists) - Responsive */}
        {currentQuestion.hint && (
          <div className="p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
            <h4 className="font-semibold mb-2 text-yellow-900 text-sm md:text-base">Hint:</h4>
            <p className="text-yellow-800 text-sm md:text-base">{currentQuestion.hint}</p>
          </div>
        )}

        {/* Citation (if exists) */}
        {currentQuestion.citation && (
          <p className="text-xs text-gray-500 italic">
            📄 Source: {currentQuestion.citation}
          </p>
        )}

        {/* Navigation Buttons - Touch-friendly, stack on very small screens */}
        <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            ← Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className={`px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
              currentQuestionIndex === totalQuestions - 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Approve Button - Touch-friendly */}
      <div className="text-center mt-6">
        <button
          onClick={() => setShowApproveAllConfirm(true)}
          className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md hover:shadow-lg text-base md:text-lg min-h-[44px]"
        >
          Finish Review
        </button>
      </div>

      {/* Question Edit Modal */}
      {editingQuestionId !== null && (
        <QuestionEditModal
          questionId={currentQuestionIndex}
          initialData={{
            question: currentQuestion.question,
            options: currentQuestion.options,
            correct_answer: currentQuestion.correct_answer,
            explanation: currentQuestion.explanation,
            citation: currentQuestion.citation,
            hint: currentQuestion.hint,
            difficulty: currentQuestion.difficulty
          }}
          onSave={handleQuestionUpdate}
          onDelete={handleQuestionDelete}
          onClose={() => setEditingQuestionId(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Delete Question?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await handleQuestionDelete();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve All Confirmation Modal */}
      {showApproveAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Approve All Questions?</h3>
            <p className="text-gray-600 mb-6">
              This will save the quiz with {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}. You can always edit it later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleApproveAll}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Yes, Approve & Save
              </button>
              <button
                onClick={() => setShowApproveAllConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Add New Question</h3>
            <p className="text-gray-600 mb-6">
              A new blank question will be added. You can then edit it to customize the content.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAddQuestion}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add Question
              </button>
              <button
                onClick={() => setShowAddQuestion(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

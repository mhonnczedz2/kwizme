'use client';

import { useState } from 'react';
import { QuizGenerationResponse } from '@/lib/db/types';

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
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApproveAllConfirm, setShowApproveAllConfirm] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Editing state for current question
  const [editForm, setEditForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    hint: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  });

  const currentQuestion = editedQuizData.questions[currentQuestionIndex];
  const totalQuestions = editedQuizData.questions.length;

  const startEditing = () => {
    setEditForm({
      question: currentQuestion.question,
      options: [...currentQuestion.options],
      correct_answer: currentQuestion.correct_answer,
      explanation: currentQuestion.explanation,
      hint: currentQuestion.hint || '',
      difficulty: currentQuestion.difficulty as 'easy' | 'medium' | 'hard'
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    const updatedQuestions = [...editedQuizData.questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      question: editForm.question,
      options: editForm.options,
      correct_answer: editForm.correct_answer,
      explanation: editForm.explanation,
      hint: editForm.hint,
      difficulty: editForm.difficulty
    };

    setEditedQuizData({
      ...editedQuizData,
      questions: updatedQuestions
    });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleDeleteQuestion = () => {
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

    setShowDeleteConfirm(false);
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
      setIsEditing(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setIsEditing(false);
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onCancel}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Cancel
        </button>
      </div>

      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Review & Approve Questions
        </h1>
        <p className="text-gray-600">Review each question before saving your quiz</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddQuestion(true)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
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

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-200">
        {!isEditing ? (
          /* View Mode */
          <>
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={startEditing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                  disabled={totalQuestions <= 1}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              {currentQuestion.question}
            </h3>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = option === currentQuestion.correct_answer;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 ${
                      isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-600">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="flex-1">{option}</span>
                      {isCorrect && (
                        <span className="text-green-600 font-semibold">✓ Correct</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-3">
              <h4 className="font-semibold mb-2 text-blue-900">Explanation:</h4>
              <p className="text-blue-800">{currentQuestion.explanation}</p>
            </div>

            {/* Hint (if exists) */}
            {currentQuestion.hint && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                <h4 className="font-semibold mb-2 text-yellow-900">Hint:</h4>
                <p className="text-yellow-800">{currentQuestion.hint}</p>
              </div>
            )}

            {/* Citation (if exists) */}
            {currentQuestion.citation && (
              <p className="text-xs text-gray-500 italic">
                📄 Source: {currentQuestion.citation}
              </p>
            )}

            {/* Navigation Buttons - Inside Card */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
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
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentQuestionIndex === totalQuestions - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          /* Edit Mode */
          <>
            <div className="space-y-4">
              {/* Difficulty Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, difficulty: 'easy' })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      editForm.difficulty === 'easy'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    Easy
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, difficulty: 'medium' })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      editForm.difficulty === 'medium'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, difficulty: 'hard' })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      editForm.difficulty === 'hard'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Hard
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <textarea
                  value={editForm.question}
                  onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options
                </label>
                {editForm.options.map((option, idx) => (
                  <div key={idx} className="mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editForm.options];
                        newOptions[idx] = e.target.value;
                        setEditForm({ ...editForm, options: newOptions });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              {/* Correct Answer Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer
                </label>
                <div className="flex flex-wrap gap-2">
                  {editForm.options.map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, correct_answer: option })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        editForm.correct_answer === option
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}. {option || `Option ${String.fromCharCode(65 + idx)}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation
                </label>
                <textarea
                  value={editForm.explanation}
                  onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Hint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hint (optional)
                </label>
                <textarea
                  value={editForm.hint}
                  onChange={(e) => setEditForm({ ...editForm, hint: e.target.value })}
                  rows={2}
                  placeholder="Add a helpful hint without giving away the answer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={saveEdit}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>

              {/* Navigation Buttons - Inside Card (Edit Mode) */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
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
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentQuestionIndex === totalQuestions - 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Approve Button - Outside card, below */}
      <div className="text-center mt-6">
        <button
          onClick={() => setShowApproveAllConfirm(true)}
          className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md hover:shadow-lg text-lg"
        >
          Finish Review
        </button>
      </div>

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
                onClick={handleDeleteQuestion}
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

'use client';

import { useState, useEffect } from 'react';
import { QuizGenerationResponse } from '@/lib/db/types';
import { createSession, saveAnswer, completeSession } from '@/lib/db/session-storage';
import { getQuizById, updateQuestion, deleteQuestion } from '@/lib/db/quiz-storage';
import { SessionConfig } from './QuizConfigModal';
import QuestionEditModal from './QuestionEditModal';

interface QuizDisplayProps {
  quizData: QuizGenerationResponse;
  config?: SessionConfig;
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
}

export default function QuizDisplay({ quizData, config, onComplete, onBack }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<{ questionIndex: number; selected: string; correct: string; isCorrect: boolean }[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [quizDataState, setQuizDataState] = useState<QuizGenerationResponse>(quizData);
  const [showMenu, setShowMenu] = useState(false);

  // Test mode: track answers but don't show results until end
  const isTestMode = config?.preset_name === 'test';
  const quickSubmit = config?.quick_submit ?? false;
  const showExplanationSetting = config?.show_explanation ?? true;

  // Initialize session and get question IDs when component mounts
  useEffect(() => {
    const initSession = async () => {
      try {
        // Create a new session
        const newSessionId = await createSession(
          quizData.quiz_id,
          quizData.questions.length
        );
        setSessionId(newSessionId);

        // Fetch the full quiz with question IDs from database
        const fullQuiz = await getQuizById(quizData.quiz_id);
        if (fullQuiz) {
          // Extract actual question IDs from the database
          const ids = fullQuiz.questions.map(q => q.question_id).filter((id): id is number => id !== undefined);
          setQuestionIds(ids);

          // Update quiz data state with full data including question IDs
          setQuizDataState(fullQuiz);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initSession();
  }, [quizData.quiz_id, quizData.questions.length]);

  const currentQuestion = quizDataState.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizDataState.questions.length - 1;

  const handleAnswerSelect = async (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);

    // Quick submit: automatically submit when answer is selected
    if (quickSubmit) {
      const isCorrect = option === currentQuestion.correct_answer;
      setIsAnswered(true);

      // Only show explanation if configured to do so
      if (showExplanationSetting && !isTestMode) {
        setShowExplanation(true);
      }

      if (isCorrect) {
        setCorrectCount(correctCount + 1);
      }

      setAnswers([...answers, {
        questionIndex: currentQuestionIndex,
        selected: option,
        correct: currentQuestion.correct_answer,
        isCorrect
      }]);

      // Save answer to database
      try {
        const selectedAnswerIndex = currentQuestion.options.indexOf(option);
        const questionId = questionIds[currentQuestionIndex];

        if (questionId && sessionId) {
          await saveAnswer(
            sessionId,
            questionId,
            selectedAnswerIndex,
            isCorrect
          );
        }
      } catch (error) {
        console.error('Failed to save answer:', error);
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!sessionId) return;

    // In test mode, submit means finish the entire quiz
    if (isTestMode) {
      // Save the current answer if one is selected
      if (selectedAnswer) {
        const isCorrect = selectedAnswer === currentQuestion.correct_answer;
        const tempCorrectCount = isCorrect ? correctCount + 1 : correctCount;

        const tempAnswers = [...answers, {
          questionIndex: currentQuestionIndex,
          selected: selectedAnswer,
          correct: currentQuestion.correct_answer,
          isCorrect
        }];

        // Save answer to database
        try {
          const selectedAnswerIndex = currentQuestion.options.indexOf(selectedAnswer);
          const questionId = questionIds[currentQuestionIndex];

          if (questionId) {
            await saveAnswer(
              sessionId,
              questionId,
              selectedAnswerIndex,
              isCorrect
            );
          }
        } catch (error) {
          console.error('Failed to save answer:', error);
        }

        // Complete the session
        try {
          await completeSession(
            sessionId,
            tempCorrectCount,
            quizData.questions.length
          );
        } catch (error) {
          console.error('Failed to complete session:', error);
        }

        // Finish quiz
        onComplete(tempCorrectCount, quizData.questions.length);
      } else {
        // No answer selected for current question, just complete with existing answers
        try {
          await completeSession(
            sessionId,
            correctCount,
            quizData.questions.length
          );
        } catch (error) {
          console.error('Failed to complete session:', error);
        }

        onComplete(correctCount, quizData.questions.length);
      }
      return;
    }

    // Non-test mode requires an answer
    if (!selectedAnswer) return;

    // Non-test mode: show results for current question
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setIsAnswered(true);

    // Show explanation based on settings (not in test mode)
    if (showExplanationSetting && !isTestMode) {
      setShowExplanation(true);
    }

    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    setAnswers([...answers, {
      questionIndex: currentQuestionIndex,
      selected: selectedAnswer,
      correct: currentQuestion.correct_answer,
      isCorrect
    }]);

    // Save answer to database
    try {
      const selectedAnswerIndex = currentQuestion.options.indexOf(selectedAnswer);
      const questionId = questionIds[currentQuestionIndex];

      if (questionId) {
        await saveAnswer(
          sessionId,
          questionId,
          selectedAnswerIndex,
          isCorrect
        );
      }
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleNextQuestion = async () => {
    // In test mode, save answer when moving to next question
    if (isTestMode && !isLastQuestion && selectedAnswer) {
      const isCorrect = selectedAnswer === currentQuestion.correct_answer;

      if (isCorrect) {
        setCorrectCount(correctCount + 1);
      }

      setAnswers([...answers, {
        questionIndex: currentQuestionIndex,
        selected: selectedAnswer,
        correct: currentQuestion.correct_answer,
        isCorrect
      }]);

      // Save answer to database
      try {
        const selectedAnswerIndex = currentQuestion.options.indexOf(selectedAnswer);
        const questionId = questionIds[currentQuestionIndex];

        if (questionId && sessionId) {
          await saveAnswer(
            sessionId,
            questionId,
            selectedAnswerIndex,
            isCorrect
          );
        }
      } catch (error) {
        console.error('Failed to save answer:', error);
      }

      // Move to next question - check if it was already answered
      const nextIndex = currentQuestionIndex + 1;
      const nextAnswer = answers.find(a => a.questionIndex === nextIndex);

      setCurrentQuestionIndex(nextIndex);

      if (nextAnswer) {
        // Restore the answered state
        setSelectedAnswer(nextAnswer.selected);
        setIsAnswered(true);
        setShowExplanation(false); // Test mode never shows explanation
      } else {
        setSelectedAnswer(null);
        setIsAnswered(false);
        setShowExplanation(false);
      }

      setShowHint(false);
      return;
    }

    if (isLastQuestion) {
      // Complete the session in database
      if (sessionId) {
        try {
          await completeSession(
            sessionId,
            correctCount,
            quizData.questions.length
          );
        } catch (error) {
          console.error('Failed to complete session:', error);
        }
      }

      // Quiz completed
      onComplete(correctCount, quizData.questions.length);
    } else {
      // Move to next question (non-test mode) - check if it was already answered
      const nextIndex = currentQuestionIndex + 1;
      const nextAnswer = answers.find(a => a.questionIndex === nextIndex);

      setCurrentQuestionIndex(nextIndex);

      if (nextAnswer) {
        // Restore the answered state
        setSelectedAnswer(nextAnswer.selected);
        setIsAnswered(true);

        // Show explanation if configured
        if (showExplanationSetting) {
          setShowExplanation(true);
        } else {
          setShowExplanation(false);
        }
      } else {
        setSelectedAnswer(null);
        setIsAnswered(false);
        setShowExplanation(false);
      }

      setShowHint(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;

      // Check if previous question was already answered
      const previousAnswer = answers.find(a => a.questionIndex === prevIndex);

      setCurrentQuestionIndex(prevIndex);

      if (previousAnswer) {
        // Restore the answered state
        setSelectedAnswer(previousAnswer.selected);
        setIsAnswered(true);

        // Show explanation if configured (non-test mode)
        if (showExplanationSetting && !isTestMode) {
          setShowExplanation(true);
        } else {
          setShowExplanation(false);
        }
      } else {
        // Reset to unanswered state
        setSelectedAnswer(null);
        setIsAnswered(false);
        setShowExplanation(false);
      }

      setShowHint(false);
    }
  };

  const handleToggleHint = () => {
    setShowHint(!showHint);
  };

  const getOptionClassName = (option: string) => {
    const baseClasses = "w-full text-left p-4 rounded-lg border-2 transition-all text-gray-900";

    if (!isAnswered || isTestMode) {
      // Before answering OR in test mode (hide correct/incorrect)
      if (selectedAnswer === option) {
        return `${baseClasses} border-blue-500 bg-blue-50`;
      }
      return `${baseClasses} border-gray-300 hover:border-blue-300 hover:bg-blue-50`;
    } else {
      // After answering (non-test mode)
      if (option === currentQuestion.correct_answer) {
        return `${baseClasses} border-green-500 bg-green-50`;
      }
      if (selectedAnswer === option && option !== currentQuestion.correct_answer) {
        return `${baseClasses} border-red-500 bg-red-50`;
      }
      return `${baseClasses} border-gray-300 bg-gray-50 opacity-60`;
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

  const handleQuestionUpdate = async (updates: {
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    citation?: string;
    hint?: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => {
    const questionId = questionIds[currentQuestionIndex];

    if (!questionId) {
      alert('Unable to edit question - question ID not found');
      return;
    }

    try {
      // Update in database
      await updateQuestion(questionId, updates);

      // Update local state
      const updatedQuestions = [...quizDataState.questions];
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

      setQuizDataState({
        ...quizDataState,
        questions: updatedQuestions
      });

      // Reset answer state if the question changed significantly
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setShowHint(false);

      setEditingQuestionId(null);
    } catch (error) {
      console.error('Failed to update question:', error);
      alert('Failed to update question. Please try again.');
    }
  };

  const handleQuestionDelete = async () => {
    const questionId = questionIds[currentQuestionIndex];

    if (!questionId) {
      alert('Unable to delete question - question ID not found');
      return;
    }

    if (quizDataState.questions.length <= 1) {
      alert('Cannot delete the last question in a quiz.');
      return;
    }

    if (!confirm('Delete this question? This cannot be undone.')) {
      return;
    }

    try {
      // Delete from database
      await deleteQuestion(questionId);

      // Update local state - remove the question
      const updatedQuestions = quizDataState.questions.filter((_, idx) => idx !== currentQuestionIndex);
      setQuizDataState({
        ...quizDataState,
        questions: updatedQuestions
      });

      // Update questionIds array
      const updatedQuestionIds = questionIds.filter((_, idx) => idx !== currentQuestionIndex);
      setQuestionIds(updatedQuestionIds);

      // Adjust current index if needed
      if (currentQuestionIndex >= updatedQuestions.length) {
        setCurrentQuestionIndex(updatedQuestions.length - 1);
      }

      // Reset answer state
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setShowHint(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back
        </button>
        <div className="text-sm font-semibold text-gray-700">
          Score: {correctCount} / {quizDataState.questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentQuestionIndex + 1) / quizDataState.questions.length) * 100}%` }}
        />
      </div>

      {/* Quiz Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Question Counter - Centered at top */}
        <div className="text-center mb-4">
          <span className="text-sm font-medium text-gray-600">
            Question {currentQuestionIndex + 1} of {quizDataState.questions.length}
          </span>
        </div>

        {/* Difficulty Badge and Menu */}
        <div className="mb-4 flex items-center justify-between">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
            {currentQuestion.difficulty.toUpperCase()}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="px-3 py-1 text-gray-700 rounded-md hover:bg-gray-100 text-lg font-medium"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    setEditingQuestionId(currentQuestionIndex);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 rounded-t-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleQuestionDelete();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 rounded-b-lg"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Question */}
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          {currentQuestion.question}
        </h2>

        {/* Hint Button */}
        {currentQuestion.hint && !isAnswered && (
          <div className="mb-4">
            <button
              onClick={handleToggleHint}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2"
            >
              💡 {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
            {showHint && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
                {currentQuestion.hint}
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={!isTestMode && isAnswered}
              className={getOptionClassName(option)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-600">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{option}</span>
                {!isTestMode && isAnswered && option === currentQuestion.correct_answer && (
                  <span className="ml-auto text-green-600">✓</span>
                )}
                {!isTestMode && isAnswered && selectedAnswer === option && option !== currentQuestion.correct_answer && (
                  <span className="ml-auto text-red-600">✗</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-800">Explanation:</h3>
            <p className="text-gray-700 mb-3">{currentQuestion.explanation}</p>
            {currentQuestion.citation && (
              <p className="text-xs text-gray-500 italic border-t border-gray-300 pt-2 mt-2">
                📄 Source: {currentQuestion.citation}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons - Non-Test Mode */}
        {!isTestMode && (
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {/* Previous Button - always show when available */}
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handlePreviousQuestion}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {/* Non-Test Mode (Learn, Fast Learn) */}
              {!quickSubmit && (
                <>
                  {!isAnswered ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isLastQuestion ? 'Finish Quiz' : 'Next Question →'}
                    </button>
                  )}
                </>
              )}

              {/* Quick Submit Mode (Fast Learn) */}
              {quickSubmit && isAnswered && (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isLastQuestion ? 'Finish Quiz' : 'Next Question →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons - Test Mode (inside card, just navigation) */}
        {isTestMode && (
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {/* Previous Button */}
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handlePreviousQuestion}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {/* Next button in test mode */}
              {!isLastQuestion && (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Test Mode Submit Button - Outside card */}
      {isTestMode && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSubmitAnswer}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg"
          >
            Submit
          </button>
        </div>
      )}

      {/* Question Edit Modal */}
      {editingQuestionId !== null && (
        <QuestionEditModal
          questionId={questionIds[currentQuestionIndex]}
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
    </div>
  );
}

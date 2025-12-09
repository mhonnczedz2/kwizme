'use client';

import { useState, useEffect } from 'react';
import { QuizGenerationResponse } from '@/lib/db/types';
import { createSession, saveAnswer, completeSession } from '@/lib/session-storage-router';
import { getQuizById, updateQuestion, deleteQuestion } from '@/lib/storage-router';
import { SessionConfig } from './QuizConfigModal';
import QuestionEditModal from './QuestionEditModal';
import type { User } from '@supabase/supabase-js';
import { shuffle, shuffleWithMapping } from '@/lib/utils/shuffle';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';

interface QuizDisplayProps {
  quizData: QuizGenerationResponse;
  config?: SessionConfig;
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
  user: User | null;
}

export default function QuizDisplay({ quizData, config, onComplete, onBack, user }: QuizDisplayProps) {
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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Randomization state
  const [displayQuestions, setDisplayQuestions] = useState<typeof quizData.questions>([]);
  const [questionIndexMap, setQuestionIndexMap] = useState<number[]>([]);
  const [optionIndexMaps, setOptionIndexMaps] = useState<number[][]>([]);

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
          quizData.questions.length,
          user
        );
        setSessionId(newSessionId);

        // Fetch the full quiz with question IDs from database
        const fullQuiz = await getQuizById(quizData.quiz_id, user);
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

  // Apply randomization based on config
  useEffect(() => {
    const randomizeQuestions = config?.randomize_questions ?? false;
    const randomizeOptions = config?.randomize_options ?? false;

    let questionsToDisplay = quizDataState.questions;
    let qIndexMap: number[] = [];
    let optMaps: number[][] = [];

    // Shuffle questions if enabled
    if (randomizeQuestions) {
      const { shuffled, indexMap } = shuffleWithMapping(quizDataState.questions);
      questionsToDisplay = shuffled;
      qIndexMap = indexMap;
    } else {
      // No shuffling, just maintain original order
      questionsToDisplay = quizDataState.questions;
      qIndexMap = quizDataState.questions.map((_, idx) => idx);
    }

    // Shuffle options for each question if enabled
    if (randomizeOptions) {
      optMaps = questionsToDisplay.map(question => {
        const { indexMap } = shuffleWithMapping(question.options);
        return indexMap;
      });

      // Apply option shuffling to the questions
      questionsToDisplay = questionsToDisplay.map((question, qIdx) => {
        const optIndexMap = optMaps[qIdx];
        const shuffledOptions = optIndexMap.map(originalIdx => question.options[originalIdx]);

        // Find the new position of the correct answer
        const originalCorrectIndex = question.options.indexOf(question.correct_answer);
        const newCorrectIndex = optIndexMap.indexOf(originalCorrectIndex);

        return {
          ...question,
          options: shuffledOptions,
          correct_answer: shuffledOptions[newCorrectIndex]
        };
      });
    } else {
      // No option shuffling, just create identity mappings
      optMaps = questionsToDisplay.map(question =>
        question.options.map((_, idx) => idx)
      );
    }

    setDisplayQuestions(questionsToDisplay);
    setQuestionIndexMap(qIndexMap);
    setOptionIndexMaps(optMaps);
  }, [quizDataState.questions, config?.randomize_questions, config?.randomize_options]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSelect: (index) => {
      if (index < currentQuestion?.options.length && !isAnswered) {
        const option = currentQuestion.options[index];
        handleAnswerSelect(option);
      }
    },
    onSubmit: () => {
      if (!isAnswered && selectedAnswer) {
        handleSubmitAnswer();
      } else if (isAnswered && !isLastQuestion) {
        handleNextQuestion();
      }
    },
    onNext: () => {
      if (isAnswered || isTestMode) {
        handleNextQuestion();
      }
    },
    onPrevious: () => {
      if (currentQuestionIndex > 0) {
        handlePreviousQuestion();
      }
    },
    onHint: () => {
      if (currentQuestion?.hint && !isAnswered) {
        handleToggleHint();
      }
    },
    onHelp: () => {
      setShowKeyboardHelp(true);
    },
    onEscape: () => {
      if (showKeyboardHelp) {
        setShowKeyboardHelp(false);
      }
    }
  }, !showKeyboardHelp && !editingQuestionId); // Disable when modals are open

  const currentQuestion = displayQuestions[currentQuestionIndex] || quizDataState.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === displayQuestions.length - 1 || currentQuestionIndex === quizDataState.questions.length - 1;

  // Safety check: if no current question, show loading or return early
  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 pt-6 md:pt-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

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
        // Map displayed question index back to original question index
        const originalQuestionIndex = questionIndexMap[currentQuestionIndex] ?? currentQuestionIndex;
        const questionId = questionIds[originalQuestionIndex];

        if (questionId && sessionId) {
          await saveAnswer(
            sessionId,
            questionId,
            selectedAnswerIndex,
            isCorrect,
            user
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
          // Map displayed question index back to original question index
          const originalQuestionIndex = questionIndexMap[currentQuestionIndex] ?? currentQuestionIndex;
          const questionId = questionIds[originalQuestionIndex];

          if (questionId) {
            await saveAnswer(
              sessionId,
              questionId,
              selectedAnswerIndex,
              isCorrect,
              user
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
            quizData.questions.length,
            user
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
            quizData.questions.length,
            user
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
      // Map displayed question index back to original question index
      const originalQuestionIndex = questionIndexMap[currentQuestionIndex] ?? currentQuestionIndex;
      const questionId = questionIds[originalQuestionIndex];

      if (questionId) {
        await saveAnswer(
          sessionId,
          questionId,
          selectedAnswerIndex,
          isCorrect,
          user
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
        // Map displayed question index back to original question index
        const originalQuestionIndex = questionIndexMap[currentQuestionIndex] ?? currentQuestionIndex;
        const questionId = questionIds[originalQuestionIndex];

        if (questionId && sessionId) {
          await saveAnswer(
            sessionId,
            questionId,
            selectedAnswerIndex,
            isCorrect,
            user
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
            quizData.questions.length,
            user
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
    const baseClasses = "w-full text-left p-4 md:p-4 rounded-lg border-2 transition-all text-gray-900 dark:text-gray-100 text-base md:text-base min-h-[56px]";

    if (!isAnswered || isTestMode) {
      // Before answering OR in test mode (hide correct/incorrect)
      if (selectedAnswer === option) {
        return `${baseClasses} border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30`;
      }
      return `${baseClasses} border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20`;
    } else {
      // After answering (non-test mode)
      if (option === currentQuestion.correct_answer) {
        return `${baseClasses} border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30`;
      }
      if (selectedAnswer === option && option !== currentQuestion.correct_answer) {
        return `${baseClasses} border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/30`;
      }
      return `${baseClasses} border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 opacity-60`;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'hard': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50';
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
    // Map displayed question index back to original question index
    const originalQuestionIndex = questionIndexMap[currentQuestionIndex] ?? currentQuestionIndex;
    const questionId = questionIds[originalQuestionIndex];

    if (!questionId) {
      alert('Unable to edit question - question ID not found');
      return;
    }

    try {
      // Update in database
      await updateQuestion(questionId, updates, user);

      // Update local state - update in the original questions array
      const updatedQuestions = [...quizDataState.questions];
      updatedQuestions[originalQuestionIndex] = {
        ...quizDataState.questions[originalQuestionIndex],
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
    // Map displayed question index back to original question index
    const originalQuestionIndex = questionIndexMap[currentQuestionIndex] ?? currentQuestionIndex;
    const questionId = questionIds[originalQuestionIndex];

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
      await deleteQuestion(questionId, user);

      // Update local state - remove the question from original array
      const updatedQuestions = quizDataState.questions.filter((_, idx) => idx !== originalQuestionIndex);
      setQuizDataState({
        ...quizDataState,
        questions: updatedQuestions
      });

      // Update questionIds array - remove from original position
      const updatedQuestionIds = questionIds.filter((_, idx) => idx !== originalQuestionIndex);
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 pt-6 md:pt-8">
      {/* Header */}
      <div className="pb-3 mb-2">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onBack}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2 min-h-[44px] text-base md:text-sm font-medium"
          >
            <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Score Badge - Centered */}
        <div className="flex justify-center mb-4">
          <div className="text-sm md:text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-full shadow">
            Score: {correctCount} / {quizDataState.questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / quizDataState.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Quiz Card */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-8">
        {/* Question Counter - Centered at top */}
        <div className="text-center mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {quizDataState.questions.length}
          </span>
        </div>

        {/* Difficulty Badge and Menu */}
        <div className="mb-2 flex items-center justify-between">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
            {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-xl font-medium"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 md:w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <button
                  onClick={() => {
                    setEditingQuestionId(currentQuestionIndex);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 md:py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-t-lg text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleQuestionDelete();
                  }}
                  className="w-full text-left px-4 py-3 md:py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400 rounded-b-lg text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Question */}
        <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-100 pl-1">
          {currentQuestion.question}
        </h2>

        {/* Hint Button */}
        {currentQuestion.hint && !isAnswered && (
          <div className="mb-2">
            <button
              onClick={handleToggleHint}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm md:text-sm flex items-center gap-2 min-h-[44px]"
            >
              💡 {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
            {showHint && (
              <div className="mt-2 p-3 md:p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {currentQuestion.hint}
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 md:space-y-3 mb-6">
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
          <div className="mb-6 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-800 text-sm md:text-base">Explanation:</h3>
            <p className="text-gray-700 mb-3 text-sm md:text-base">{currentQuestion.explanation}</p>
            {currentQuestion.citation && (
              <p className="text-xs text-gray-500 italic border-t border-gray-300 pt-2 mt-2">
                📄 Source: {currentQuestion.citation}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons - Non-Test Mode */}
        {!isTestMode && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
                currentQuestionIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              ←
            </button>

            <button
              onClick={() => {
                if (!isAnswered && selectedAnswer) {
                  handleSubmitAnswer();
                } else if (isAnswered) {
                  handleNextQuestion();
                }
              }}
              disabled={!selectedAnswer && !isAnswered}
              className={`px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
                !selectedAnswer && !isAnswered
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              →
            </button>
          </div>
        )}

        {/* Action Buttons - Test Mode (inside card, just navigation) */}
        {isTestMode && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
                currentQuestionIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              ←
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={isLastQuestion}
              className={`px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px] ${
                isLastQuestion
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Test Mode Submit Button - Outside card */}
      {isTestMode && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSubmitAnswer}
            className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-base md:text-lg shadow-lg min-h-[44px]"
          >
            Submit
          </button>
        </div>
      )}

      {/* Question Edit Modal */}
      {editingQuestionId !== null && (
        <QuestionEditModal
          questionId={questionIds[questionIndexMap[currentQuestionIndex] ?? currentQuestionIndex]}
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

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
      )}

      {/* Keyboard Shortcuts Hint - Fixed position */}
      {/* Hidden per user request - users will discover shortcuts naturally */}
      {/*
      <button
        onClick={() => setShowKeyboardHelp(true)}
        className="fixed bottom-6 right-6 w-10 h-10 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-lg font-semibold z-40"
        title="Keyboard Shortcuts (Press ?)"
      >
        ?
      </button>
      */}
    </div>
  );
}

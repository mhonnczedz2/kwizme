'use client';

import { useState } from 'react';
import { QuizGenerationResponse } from '@/lib/db/types';

interface QuizDisplayProps {
  quizData: QuizGenerationResponse;
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
}

export default function QuizDisplay({ quizData, onComplete, onBack }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<{ questionIndex: number; selected: string; correct: string; isCorrect: boolean }[]>([]);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setIsAnswered(true);
    setShowExplanation(true);

    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    setAnswers([...answers, {
      questionIndex: currentQuestionIndex,
      selected: selectedAnswer,
      correct: currentQuestion.correct_answer,
      isCorrect
    }]);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Quiz completed
      onComplete(correctCount, quizData.questions.length);
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setShowHint(false);
    }
  };

  const handleToggleHint = () => {
    setShowHint(!showHint);
  };

  const getOptionClassName = (option: string) => {
    const baseClasses = "w-full text-left p-4 rounded-lg border-2 transition-all";

    if (!isAnswered) {
      // Before answering
      if (selectedAnswer === option) {
        return `${baseClasses} border-blue-500 bg-blue-50`;
      }
      return `${baseClasses} border-gray-300 hover:border-blue-300 hover:bg-blue-50`;
    } else {
      // After answering
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
        <div className="text-sm text-gray-600">
          Question {currentQuestionIndex + 1} of {quizData.questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
        />
      </div>

      {/* Quiz Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Difficulty Badge */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
            {currentQuestion.difficulty.toUpperCase()}
          </span>
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
              disabled={isAnswered}
              className={getOptionClassName(option)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-600">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{option}</span>
                {isAnswered && option === currentQuestion.correct_answer && (
                  <span className="ml-auto text-green-600">✓</span>
                )}
                {isAnswered && selectedAnswer === option && option !== currentQuestion.correct_answer && (
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

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Score: {correctCount} / {currentQuestionIndex + (isAnswered ? 1 : 0)}
          </div>
          <div className="flex gap-3">
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
          </div>
        </div>
      </div>
    </div>
  );
}

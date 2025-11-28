'use client';

import { useState, useEffect } from 'react';
import { Quiz, ReviewSession } from '@/lib/db/types';
import { getAllQuizzes, getQuizById, deleteQuiz, getQuizQuestionCount } from '@/lib/db/quiz-storage';
import { getSessionsForQuiz, getAnswersForSession, deleteSessionsForQuiz } from '@/lib/db/session-storage';
import { initDatabase, executeUpdate } from '@/lib/db/client';
import { QuizGenerationResponse, AnswerRecord } from '@/lib/db/types';
import QuizConfigModal, { SessionConfig } from './QuizConfigModal';

interface QuizHistoryProps {
  onSelectQuiz: (quiz: QuizGenerationResponse, config?: SessionConfig, answers?: AnswerRecord[], sessionScore?: { correct: number; total: number }) => void;
  onBack: () => void;
}

interface QuizWithSessions {
  quiz: Quiz;
  sessions: ReviewSession[];
}

export default function QuizHistory({ onSelectQuiz, onBack }: QuizHistoryProps) {
  const [quizzesWithSessions, setQuizzesWithSessions] = useState<QuizWithSessions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [configuringQuizId, setConfiguringQuizId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(15);

  useEffect(() => {
    loadQuizzesWithSessions();
  }, []);

  const loadQuizzesWithSessions = async () => {
    try {
      const allQuizzes = await getAllQuizzes();

      // Load sessions for each quiz
      const quizzesWithSessionsData = await Promise.all(
        allQuizzes.map(async (quiz) => {
          const sessions = await getSessionsForQuiz(quiz.quiz_id);
          return { quiz, sessions };
        })
      );

      setQuizzesWithSessions(quizzesWithSessionsData);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionClick = async (quizId: string, sessionId: string) => {
    try {
      const quiz = await getQuizById(quizId);
      if (!quiz) {
        alert('Quiz not found');
        return;
      }

      // Load the answers for this specific session
      const answers = await getAnswersForSession(sessionId);

      // Find the session to get the score
      const quizWithSessions = quizzesWithSessions.find(q => q.quiz.quiz_id === quizId);
      const session = quizWithSessions?.sessions.find(s => s.session_id === sessionId);

      if (session) {
        // Review mode with this specific session (no config needed for review)
        onSelectQuiz(quiz, undefined, answers, {
          correct: session.correct_answers || 0,
          total: session.total_questions
        });
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      alert('Failed to load session. Please try again.');
    }
  };

  const handleTakeQuiz = async (quizId: string) => {
    try {
      // Show config modal
      const count = await getQuizQuestionCount(quizId);
      setQuestionCount(count);
      setConfiguringQuizId(quizId);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert('Failed to load quiz. Please try again.');
    }
  };

  const handleDeleteSession = async (sessionId: string, quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      // Delete the specific session
      const db = await initDatabase();

      // Delete answer records first
      executeUpdate(db, 'DELETE FROM answer_records WHERE session_id = ?', [sessionId]);

      // Delete the session
      executeUpdate(db, 'DELETE FROM review_sessions WHERE session_id = ?', [sessionId]);

      console.log(`✅ Deleted session: ${sessionId}`);

      // Reload to update the UI
      await loadQuizzesWithSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  const toggleExpanded = (quizId: string) => {
    setExpandedQuizId(expandedQuizId === quizId ? null : quizId);
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

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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
      {!isLoading && quizzesWithSessions.length === 0 && (
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
      {!isLoading && quizzesWithSessions.length > 0 && (
        <div className="space-y-4">
          {quizzesWithSessions.map(({ quiz, sessions }) => {
            const isExpanded = expandedQuizId === quiz.quiz_id;
            const completedSessions = sessions.filter(s => s.completed_at);

            return (
            <div
              key={quiz.quiz_id}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              {/* Quiz Header - Clickable to expand/collapse */}
              <div
                onClick={() => toggleExpanded(quiz.quiz_id)}
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {quiz.quiz_title}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(quiz.difficulty_level)}`}>
                      {quiz.difficulty_level.toUpperCase()}
                    </span>
                  </div>

                  {/* Institution and Program */}
                  {(quiz.institution || quiz.program) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{quiz.institution}</span>
                      {quiz.program && quiz.institution && <span>•</span>}
                      {quiz.program && <span>{quiz.program}</span>}
                    </div>
                  )}

                  {/* Course and Course Code */}
                  {quiz.course_code && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-medium">{quiz.course_code}</span>
                    </div>
                  )}

                  {quiz.topic && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{quiz.topic}</span>
                    </div>
                  )}

                  {/* File name, date, and session count */}
                  <div className="flex items-center gap-3 text-gray-500 mt-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs">{quiz.file_name}</span>
                    </div>
                    <span className="text-xs">•</span>
                    <span className="text-xs">{formatDate(quiz.created_at)}</span>
                    {completedSessions.length > 0 && (
                      <>
                        <span className="text-xs">•</span>
                        <span className="text-xs font-medium text-blue-600">
                          {completedSessions.length} attempt{completedSessions.length !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete and Expand buttons */}
                <div className="flex items-center gap-2">
                  {completedSessions.length > 0 && (
                    <div className="text-gray-400">
                      <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              </div>

              {/* Expanded Sessions List */}
              {isExpanded && completedSessions.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="space-y-2">
                    {completedSessions.map((session, index) => {
                      const scorePercentage = session.score_percentage || 0;
                      const scoreColor = scorePercentage >= 80 ? 'text-green-600' : scorePercentage >= 60 ? 'text-yellow-600' : 'text-red-600';

                      return (
                        <div
                          key={session.session_id}
                          className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className="flex items-center gap-4 flex-1 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionClick(quiz.quiz_id, session.session_id);
                              }}
                            >
                              <div className="text-sm text-gray-500">
                                #{completedSessions.length - index}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatShortDate(session.completed_at!)}
                                </div>
                                <div className={`text-lg font-bold ${scoreColor}`}>
                                  {session.correct_answers} / {session.total_questions}
                                  <span className="text-sm ml-2">({scorePercentage.toFixed(1)}%)</span>
                                </div>
                              </div>
                              <div className="ml-auto text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Review →
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(session.session_id, quiz.quiz_id, e)}
                              className="ml-4 text-red-500 hover:text-red-700 p-2"
                              title="Delete session"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Take Quiz Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTakeQuiz(quiz.quiz_id);
                    }}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Take Quiz Again
                  </button>
                </div>
              )}

              {/* No sessions - show take quiz button */}
              {!isExpanded && completedSessions.length === 0 && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTakeQuiz(quiz.quiz_id);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Take Quiz
                  </button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Quiz Config Modal */}
      {configuringQuizId && (
        <QuizConfigModal
          totalQuestions={questionCount}
          onStart={async (config) => {
            try {
              const quiz = await getQuizById(configuringQuizId);
              if (quiz) {
                onSelectQuiz(quiz, config);
                setConfiguringQuizId(null);
              }
            } catch (error) {
              console.error('Failed to load quiz:', error);
              alert('Failed to load quiz. Please try again.');
            }
          }}
          onCancel={() => setConfiguringQuizId(null)}
        />
      )}
    </div>
  );
}

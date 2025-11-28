'use client';

import { useState, useEffect } from 'react';
import { getAllQuizzes, deleteQuiz, updateQuizMetadata, getQuizQuestionCount } from '@/lib/db/quiz-storage';
import { deleteSessionsForQuiz, getRecentQuizSessions } from '@/lib/db/session-storage';
import { Quiz } from '@/lib/db/types';
import QuizConfigModal, { SessionConfig } from './QuizConfigModal';

interface QuizBrowserProps {
  onSelectQuiz: (quizId: string, config: SessionConfig) => void;
  onBack: () => void;
}

export default function QuizBrowser({ onSelectQuiz, onBack }: QuizBrowserProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecents, setShowRecents] = useState(true); // Recents on by default
  const [recentQuizIds, setRecentQuizIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    difficulty_level: '',
    institution: '',
    program: '',
    course_code: ''
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [configuringQuizId, setConfiguringQuizId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [editForm, setEditForm] = useState({
    quiz_title: '',
    institution: '',
    program: '',
    course_code: '',
    topic: '',
    difficulty_level: 'medium'
  });

  useEffect(() => {
    loadQuizzes();
    loadRecentQuizzes();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const loadQuizzes = async () => {
    try {
      const allQuizzes = await getAllQuizzes();
      setQuizzes(allQuizzes);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentQuizzes = async () => {
    try {
      const recentIds = await getRecentQuizSessions(5);
      setRecentQuizIds(recentIds);
    } catch (error) {
      console.error('Failed to load recent quizzes:', error);
    }
  };

  const handleDeleteQuiz = async (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null); // Close menu

    if (!confirm('Are you sure you want to delete this quiz and all its sessions?')) {
      return;
    }

    try {
      // Delete all sessions for this quiz first
      await deleteSessionsForQuiz(quizId);

      // Delete the quiz
      await deleteQuiz(quizId);

      console.log(`✅ Deleted quiz: ${quizId}`);

      // Reload the list
      await loadQuizzes();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert('Failed to delete quiz. Please try again.');
    }
  };

  const handleEditQuiz = (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(null);

    const quiz = quizzes.find(q => q.quiz_id === quizId);
    if (quiz) {
      setEditingQuiz(quiz);
      setEditForm({
        quiz_title: quiz.quiz_title,
        institution: quiz.institution || '',
        program: quiz.program || '',
        course_code: quiz.course_code || '',
        topic: quiz.topic || '',
        difficulty_level: quiz.difficulty_level
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingQuiz) return;

    try {
      await updateQuizMetadata(editingQuiz.quiz_id, editForm);

      // Reload quizzes to reflect changes
      await loadQuizzes();

      // Close modal
      setEditingQuiz(null);
    } catch (error) {
      console.error('Failed to update quiz:', error);
      alert('Failed to update quiz. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingQuiz(null);
  };

  const toggleMenu = (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === quizId ? null : quizId);
  };

  // Get unique values for filters
  const getUniqueValues = (field: keyof Quiz): string[] => {
    const values = quizzes
      .map(quiz => quiz[field] as string)
      .filter(value => value && value.trim() !== '');
    return Array.from(new Set(values)).sort();
  };

  // Filter quizzes based on selected filters and recents
  const filteredQuizzes = quizzes.filter(quiz => {
    // Apply recents filter first
    if (showRecents && recentQuizIds.length > 0 && !recentQuizIds.includes(quiz.quiz_id)) {
      return false;
    }

    // Apply other filters
    if (filters.difficulty_level && quiz.difficulty_level !== filters.difficulty_level) return false;
    if (filters.institution && quiz.institution !== filters.institution) return false;
    if (filters.program && quiz.program !== filters.program) return false;
    if (filters.course_code && quiz.course_code !== filters.course_code) return false;
    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    setShowRecents(false);
    setFilters({
      difficulty_level: '',
      institution: '',
      program: '',
      course_code: ''
    });
  };

  // Check if any filter is active
  const hasActiveFilters = showRecents || Object.values(filters).some(value => value !== '');

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading quizzes...</p>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes Yet</h3>
        <p className="text-gray-600 mb-6">
          Generate your first quiz to get started!
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Section - Compact Tag-based Design */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Categories</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Recents Filter */}
          <button
            onClick={() => setShowRecents(!showRecents)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              showRecents
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⏱️ Recents
          </button>

          {/* Difficulty Tags */}
          {getUniqueValues('difficulty_level').map(value => {
            const difficultyColors = {
              easy: { active: 'bg-green-600', inactive: 'bg-green-100 text-green-700' },
              medium: { active: 'bg-yellow-600', inactive: 'bg-yellow-100 text-yellow-700' },
              hard: { active: 'bg-red-600', inactive: 'bg-red-100 text-red-700' }
            };
            const colors = difficultyColors[value as keyof typeof difficultyColors] || { active: 'bg-gray-600', inactive: 'bg-gray-100 text-gray-700' };

            return (
              <button
                key={`difficulty-${value}`}
                onClick={() => setFilters({ ...filters, difficulty_level: filters.difficulty_level === value ? '' : value })}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.difficulty_level === value
                    ? `${colors.active} text-white`
                    : colors.inactive
                }`}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            );
          })}

          {/* Institution Tags */}
          {getUniqueValues('institution').map(value => (
            <button
              key={`institution-${value}`}
              onClick={() => setFilters({ ...filters, institution: filters.institution === value ? '' : value })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.institution === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏛️ {value}
            </button>
          ))}

          {/* Program Tags */}
          {getUniqueValues('program').map(value => (
            <button
              key={`program-${value}`}
              onClick={() => setFilters({ ...filters, program: filters.program === value ? '' : value })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.program === value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎓 {value}
            </button>
          ))}

          {/* Course Tags */}
          {getUniqueValues('course_code').map(value => (
            <button
              key={`course_code-${value}`}
              onClick={() => setFilters({ ...filters, course_code: filters.course_code === value ? '' : value })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.course_code === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📚 {value}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{filteredQuizzes.length}</span> quiz{filteredQuizzes.length !== 1 ? 'es' : ''} {hasActiveFilters ? 'found' : 'available'}
        </p>
      </div>

      {/* No results message */}
      {filteredQuizzes.length === 0 && hasActiveFilters && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes Found</h3>
          <p className="text-gray-600 mb-6">
            No quizzes match your current filters.
          </p>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Quiz Cards */}
      {filteredQuizzes.map((quiz) => (
        <div
          key={quiz.quiz_id}
          onClick={async () => {
            const count = await getQuizQuestionCount(quiz.quiz_id);
            setQuestionCount(count);
            setConfiguringQuizId(quiz.quiz_id);
          }}
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer relative"
        >
          {/* Three-dot menu button */}
          <div className="absolute top-6 right-6">
            <button
              onClick={(e) => toggleMenu(quiz.quiz_id, e)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="More options"
            >
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                <circle cx="8" cy="2" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="14" r="1.5" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {openMenuId === quiz.quiz_id && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={(e) => handleEditQuiz(quiz.quiz_id, e)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Details
                </button>
                <button
                  onClick={(e) => handleDeleteQuiz(quiz.quiz_id, e)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Topic | Quiz Title with Difficulty Badge inline */}
          <div className="mb-2 pr-10 flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {quiz.topic && (
                <span>{quiz.topic} | </span>
              )}
              {quiz.quiz_title}
            </h3>
            {/* Difficulty Badge - inline after title */}
            <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
              quiz.difficulty_level === 'easy'
                ? 'bg-green-100 text-green-700'
                : quiz.difficulty_level === 'hard'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {quiz.difficulty_level.charAt(0).toUpperCase() + quiz.difficulty_level.slice(1)}
            </span>
          </div>

          {/* Institution • Program • Course */}
          {(quiz.institution || quiz.program || quiz.course_code) && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              {quiz.institution && (
                <>
                  <span>🏛️</span>
                  <span>{quiz.institution}</span>
                </>
              )}
              {quiz.institution && quiz.program && <span>•</span>}
              {quiz.program && (
                <>
                  <span>🎓</span>
                  <span>{quiz.program}</span>
                </>
              )}
              {(quiz.institution || quiz.program) && quiz.course_code && <span>•</span>}
              {quiz.course_code && (
                <>
                  <span>📚</span>
                  <span>{quiz.course_code}</span>
                </>
              )}
            </div>
          )}

          {/* File name */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{quiz.file_name}</span>
          </div>

          {/* Date - Lower Left */}
          <div className="text-xs text-gray-400">
            {new Date(quiz.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}

    {/* Edit Modal */}
    {editingQuiz && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Quiz Details</h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Quiz Title */}
              <div>
                <label htmlFor="edit_quiz_title" className="block text-sm font-medium text-gray-700 mb-1">
                  Quiz Title
                </label>
                <input
                  id="edit_quiz_title"
                  type="text"
                  value={editForm.quiz_title}
                  onChange={(e) => setEditForm({ ...editForm, quiz_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Topic */}
              <div>
                <label htmlFor="edit_topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <input
                  id="edit_topic"
                  type="text"
                  value={editForm.topic}
                  onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                  placeholder="e.g., Cell Biology - Chapter 5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, difficulty_level: 'easy' })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      editForm.difficulty_level === 'easy'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    Easy
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, difficulty_level: 'medium' })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      editForm.difficulty_level === 'medium'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, difficulty_level: 'hard' })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      editForm.difficulty_level === 'hard'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Hard
                  </button>
                </div>
              </div>

              {/* Institution */}
              <div>
                <label htmlFor="edit_institution" className="block text-sm font-medium text-gray-700 mb-1">
                  Institution
                </label>
                <input
                  id="edit_institution"
                  type="text"
                  value={editForm.institution}
                  onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                  placeholder="e.g., UC Berkeley"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Program */}
              <div>
                <label htmlFor="edit_program" className="block text-sm font-medium text-gray-700 mb-1">
                  Program
                </label>
                <input
                  id="edit_program"
                  type="text"
                  value={editForm.program}
                  onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                  placeholder="e.g., Biology Major"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Course Code */}
              <div>
                <label htmlFor="edit_course_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <input
                  id="edit_course_code"
                  type="text"
                  value={editForm.course_code}
                  onChange={(e) => setEditForm({ ...editForm, course_code: e.target.value })}
                  placeholder="e.g., BIO 101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Quiz Config Modal */}
    {configuringQuizId && (
      <QuizConfigModal
        totalQuestions={questionCount}
        onStart={(config) => {
          onSelectQuiz(configuringQuizId, config);
          setConfiguringQuizId(null);
        }}
        onCancel={() => setConfiguringQuizId(null)}
      />
    )}
    </div>
  );
}

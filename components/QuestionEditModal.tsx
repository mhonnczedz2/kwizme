'use client';

import { useState, useEffect } from 'react';

interface QuestionEditModalProps {
  questionId: number;
  initialData: {
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    citation?: string;
    hint?: string;
    difficulty: string;
  };
  onSave: (updates: {
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    citation?: string;
    hint?: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export default function QuestionEditModal({ questionId, initialData, onSave, onDelete, onClose }: QuestionEditModalProps) {
  const [formData, setFormData] = useState({
    question_text: initialData.question,
    options: [...initialData.options],
    correct_answer: initialData.correct_answer,
    explanation: initialData.explanation,
    citation: initialData.citation || '',
    hint: initialData.hint || '',
    difficulty: initialData.difficulty as 'easy' | 'medium' | 'hard'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.question_text.trim()) {
      newErrors.question_text = 'Question text is required';
    }

    formData.options.forEach((option, index) => {
      if (!option.trim()) {
        newErrors[`option_${index}`] = `Option ${String.fromCharCode(65 + index)} is required`;
      }
    });

    if (!formData.correct_answer) {
      newErrors.correct_answer = 'Please select the correct answer';
    } else if (!formData.options.includes(formData.correct_answer)) {
      newErrors.correct_answer = 'Correct answer must be one of the options';
    }

    if (!formData.explanation.trim()) {
      newErrors.explanation = 'Explanation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save question:', error);
      alert('Failed to save question. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this question? This cannot be undone.')) return;

    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;

    // If this option was the correct answer, update correct_answer
    if (formData.options[index] === formData.correct_answer) {
      setFormData({ ...formData, options: newOptions, correct_answer: value });
    } else {
      setFormData({ ...formData, options: newOptions });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Edit Question</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Question Text */}
          <div>
            <label htmlFor="question_text" className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              id="question_text"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 ${
                errors.question_text ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your question here..."
            />
            {errors.question_text && (
              <p className="mt-1 text-xs text-red-600">{errors.question_text}</p>
            )}
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options *
            </label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-gray-100 rounded font-semibold text-gray-700">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                        errors[`option_${index}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    {errors[`option_${index}`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`option_${index}`]}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, correct_answer: option })}
                    className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      formData.correct_answer === option
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title="Mark as correct answer"
                  >
                    {formData.correct_answer === option ? '✓ Correct' : 'Set Correct'}
                  </button>
                </div>
              ))}
            </div>
            {errors.correct_answer && (
              <p className="mt-2 text-xs text-red-600">{errors.correct_answer}</p>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty *
            </label>
            <div className="flex gap-3">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: level })}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.difficulty === level
                      ? level === 'easy'
                        ? 'bg-green-600 text-white'
                        : level === 'medium'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
              Explanation *
            </label>
            <textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 ${
                errors.explanation ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Explain why the correct answer is correct..."
            />
            {errors.explanation && (
              <p className="mt-1 text-xs text-red-600">{errors.explanation}</p>
            )}
          </div>

          {/* Citation (Optional) */}
          <div>
            <label htmlFor="citation" className="block text-sm font-medium text-gray-700 mb-2">
              Citation (optional)
            </label>
            <input
              id="citation"
              type="text"
              value={formData.citation}
              onChange={(e) => setFormData({ ...formData, citation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., MDN Web Docs - Variables"
            />
          </div>

          {/* Hint (Optional) */}
          <div>
            <label htmlFor="hint" className="block text-sm font-medium text-gray-700 mb-2">
              Hint (optional)
            </label>
            <textarea
              id="hint"
              value={formData.hint}
              onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
              placeholder="Provide a hint to help answer the question..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Question'}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

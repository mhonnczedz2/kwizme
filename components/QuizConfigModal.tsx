'use client';

import { useState, useEffect } from 'react';

export interface SessionConfig {
  quick_submit: boolean;
  show_explanation: boolean;
  randomize_options: boolean;
  randomize_questions: boolean;
  num_questions_selected: number;
  preset_name: 'learn' | 'test' | 'fast_learn' | 'custom';
}

interface QuizConfigModalProps {
  totalQuestions: number;
  onStart: (config: SessionConfig) => void;
  onCancel: () => void;
}

const PRESETS: Record<string, Omit<SessionConfig, 'num_questions_selected'>> = {
  learn: {
    quick_submit: false,
    show_explanation: true,
    randomize_options: false,
    randomize_questions: false,
    preset_name: 'learn'
  },
  test: {
    quick_submit: false,
    show_explanation: false,
    randomize_options: false,
    randomize_questions: false,
    preset_name: 'test'
  },
  fast_learn: {
    quick_submit: true,
    show_explanation: false,
    randomize_options: false,
    randomize_questions: false,
    preset_name: 'fast_learn'
  }
};

export default function QuizConfigModal({ totalQuestions, onStart, onCancel }: QuizConfigModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<'learn' | 'test' | 'fast_learn' | 'custom'>('learn');
  const [customConfig, setCustomConfig] = useState<SessionConfig>({
    quick_submit: false,
    show_explanation: true,
    randomize_options: false,
    randomize_questions: false,
    num_questions_selected: totalQuestions,
    preset_name: 'custom'
  });
  const [numQuestionsError, setNumQuestionsError] = useState<string>('');

  // Load last selection from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quizme_last_preset');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSelectedPreset(parsed.preset_name);
      if (parsed.preset_name === 'custom') {
        setCustomConfig(parsed);
      }
    }
  }, []);

  const handlePresetClick = (preset: 'learn' | 'test' | 'fast_learn' | 'custom') => {
    setSelectedPreset(preset);
  };

  const handleStartQuiz = () => {
    let config: SessionConfig;

    if (selectedPreset === 'custom') {
      config = customConfig;
    } else {
      config = {
        ...PRESETS[selectedPreset],
        num_questions_selected: totalQuestions,
        preset_name: selectedPreset
      };
    }

    // Save to localStorage
    localStorage.setItem('quizme_last_preset', JSON.stringify(config));

    onStart(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-start mb-4 md:mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Choose Quiz Mode</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Select how you want to take this quiz</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-3">Session Type</h3>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 md:gap-3">
              <button
                onClick={() => handlePresetClick('learn')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                  selectedPreset === 'learn'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📖 Learn
              </button>
              <button
                onClick={() => handlePresetClick('test')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                  selectedPreset === 'test'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📝 Test
              </button>
              <button
                onClick={() => handlePresetClick('fast_learn')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                  selectedPreset === 'fast_learn'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⚡ Fast Learn
              </button>
              <button
                onClick={() => handlePresetClick('custom')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                  selectedPreset === 'custom'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⚙️ Custom
              </button>
            </div>
          </div>

          {/* Preset Descriptions */}
          {selectedPreset !== 'custom' && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {selectedPreset === 'learn' && '📖 Learn Mode'}
                {selectedPreset === 'test' && '📝 Test Mode'}
                {selectedPreset === 'fast_learn' && '⚡ Fast Learn Mode'}
              </h4>
              <p className="text-xs md:text-sm text-gray-600">
                {selectedPreset === 'learn' && 'Focused learning with explanations after each question. Take your time to understand each concept.'}
                {selectedPreset === 'test' && 'Simulate exam conditions without explanations. Test your knowledge under realistic conditions.'}
                {selectedPreset === 'fast_learn' && 'Quick review mode with auto-submit. Perfect for rapid-fire practice and spaced repetition.'}
              </p>
            </div>
          )}

          {/* Custom Configuration Options */}
          {selectedPreset === 'custom' && (
            <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
              <h3 className="text-xs md:text-sm font-semibold text-gray-700">Configuration</h3>

              {/* Quick Submit Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-h-[60px]">
                <div className="pr-4">
                  <label className="text-sm font-medium text-gray-700">Quick Submit</label>
                  <p className="text-xs text-gray-500">Auto-submit on answer selection</p>
                </div>
                <button
                  onClick={() => setCustomConfig({ ...customConfig, quick_submit: !customConfig.quick_submit })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors min-h-[44px] flex-shrink-0 ${
                    customConfig.quick_submit ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      customConfig.quick_submit ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Explanation Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-h-[60px]">
                <div className="pr-4">
                  <label className="text-sm font-medium text-gray-700">Show Explanation</label>
                  <p className="text-xs text-gray-500">Display explanation after each answer</p>
                </div>
                <button
                  onClick={() => setCustomConfig({ ...customConfig, show_explanation: !customConfig.show_explanation })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors min-h-[44px] flex-shrink-0 ${
                    customConfig.show_explanation ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      customConfig.show_explanation ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Randomize Options Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-h-[60px]">
                <div className="pr-4">
                  <label className="text-sm font-medium text-gray-700">Randomize Options</label>
                  <p className="text-xs text-gray-500">Shuffle answer choices</p>
                </div>
                <button
                  onClick={() => setCustomConfig({ ...customConfig, randomize_options: !customConfig.randomize_options })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors min-h-[44px] flex-shrink-0 ${
                    customConfig.randomize_options ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      customConfig.randomize_options ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Randomize Questions Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-h-[60px]">
                <div className="pr-4">
                  <label className="text-sm font-medium text-gray-700">Randomize Questions</label>
                  <p className="text-xs text-gray-500">Shuffle question order</p>
                </div>
                <button
                  onClick={() => setCustomConfig({ ...customConfig, randomize_questions: !customConfig.randomize_questions })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors min-h-[44px] flex-shrink-0 ${
                    customConfig.randomize_questions ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      customConfig.randomize_questions ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Number of Questions */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={customConfig.num_questions_selected}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Update the value regardless of what they type
                    setCustomConfig({ ...customConfig, num_questions_selected: value as any });

                    // Clear error if empty
                    if (value === '') {
                      setNumQuestionsError('');
                      return;
                    }

                    // Check if it's a valid integer (no decimals, no letters mixed in)
                    if (!/^\d+$/.test(value)) {
                      setNumQuestionsError('Please enter a valid number');
                      return;
                    }

                    // Validate range
                    const numValue = parseInt(value);
                    if (numValue < 1) {
                      setNumQuestionsError('Number must be at least 1');
                    } else if (numValue > totalQuestions) {
                      setNumQuestionsError(`Number must be at most ${totalQuestions}`);
                    } else {
                      setNumQuestionsError('');
                    }
                  }}
                  className={`w-full px-4 py-3 md:px-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-base ${
                    numQuestionsError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {numQuestionsError && (
                  <p className="text-xs text-red-600 mt-1">{numQuestionsError}</p>
                )}
                {!numQuestionsError && (
                  <p className="text-xs text-gray-500 mt-1">Maximum: {totalQuestions} questions</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 md:pt-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleStartQuiz}
              className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] font-medium"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

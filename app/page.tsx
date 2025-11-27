'use client';

import { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import QuizDisplay from '@/components/QuizDisplay';
import QuizResults from '@/components/QuizResults';
import { QuizGenerationResponse } from '@/lib/db/types';

type AppState = 'upload' | 'quiz' | 'results';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizData, setQuizData] = useState<QuizGenerationResponse | null>(null);
  const [finalScore, setFinalScore] = useState<{ score: number; total: number } | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('pdf_file', selectedFile);
      formData.append('num_questions', '15');
      formData.append('difficulty', 'medium');

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Quiz generated successfully:', data);
        setQuizData(data);
        setAppState('quiz');
      } else {
        alert(`Error: ${data.error || 'Failed to generate quiz'}`);
      }
    } catch (error) {
      console.error('❌ Quiz generation error:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuizComplete = (score: number, total: number) => {
    setFinalScore({ score, total });
    setAppState('results');
  };

  const handleBackToUpload = () => {
    setAppState('upload');
    setSelectedFile(null);
    setQuizData(null);
    setFinalScore(null);
  };

  const handleTryAgain = () => {
    setAppState('quiz');
    setFinalScore(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Upload State */}
        {appState === 'upload' && (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                QuizMe
              </h1>
              <p className="text-xl text-gray-600">
                Generate practice quizzes from your PDFs using AI
              </p>
            </div>

            {/* Upload Zone */}
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
              <FileUploadZone onFileSelect={handleFileSelect} />

              {/* Generate Button */}
              {selectedFile && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGenerating}
                    className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                      isGenerating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Generating Quiz...
                      </span>
                    ) : (
                      'Generate Quiz'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Features Preview */}
            <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Upload PDF</h3>
                <p className="text-sm text-gray-600">
                  Upload any study material or lecture notes
                </p>
              </div>

              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Generation</h3>
                <p className="text-sm text-gray-600">
                  AI creates personalized practice questions
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Practice & Learn</h3>
                <p className="text-sm text-gray-600">
                  Take quizzes anytime, track your progress
                </p>
              </div>
            </div>
          </>
        )}

        {/* Quiz State */}
        {appState === 'quiz' && quizData && (
          <QuizDisplay
            quizData={quizData}
            onComplete={handleQuizComplete}
            onBack={handleBackToUpload}
          />
        )}

        {/* Results State */}
        {appState === 'results' && quizData && finalScore && (
          <QuizResults
            score={finalScore.score}
            total={finalScore.total}
            quizTitle={quizData.pdf_filename || 'Generated Quiz'}
            onTryAgain={handleTryAgain}
            onBackHome={handleBackToUpload}
          />
        )}
      </div>
    </main>
  );
}

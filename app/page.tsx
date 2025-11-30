'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import FileUploadZone, { OrganizationMetadata } from '@/components/FileUploadZone';
import QuizDisplay from '@/components/QuizDisplay';
import QuizResults from '@/components/QuizResults';
import QuizBrowser from '@/components/QuizBrowser';
import QuizHistory from '@/components/QuizHistory';
import QuizReview from '@/components/QuizReview';
import QuizReviewApproval from '@/components/QuizReviewApproval';
import QuizApprovedScreen from '@/components/QuizApprovedScreen';
import SidePanel from '@/components/SidePanel';
import { QuizGenerationResponse, AnswerRecord } from '@/lib/db/types';
import { SessionConfig } from '@/components/QuizConfigModal';
import { saveQuiz, getQuizById } from '@/lib/storage-router';
import { seedDefaultQuizzes } from '@/lib/db/quiz-storage';

type AppState = 'home' | 'generate' | 'quizzes' | 'history' | 'reviewing-approval' | 'quiz-approved' | 'taking-quiz' | 'reviewing-quiz' | 'results';

// Force dynamic rendering - app uses Supabase client
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const [appState, setAppState] = useState<AppState>('home');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [organizationMetadata, setOrganizationMetadata] = useState<OrganizationMetadata>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizData, setQuizData] = useState<QuizGenerationResponse | null>(null);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [finalScore, setFinalScore] = useState<{ score: number; total: number } | null>(null);
  const [reviewData, setReviewData] = useState<{
    answers: AnswerRecord[];
    sessionScore: { correct: number; total: number };
  } | null>(null);
  const [reviewContext, setReviewContext] = useState<'generation' | 'browser' | null>(null);
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [gridDirection, setGridDirection] = useState('40px 40px');

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoadingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Seed database with default quizzes on every load
  useEffect(() => {
    seedDefaultQuizzes().catch(console.error);
  }, []);

  // Change grid direction randomly every animation cycle (8s)
  useEffect(() => {
    const directions = [
      '40px 40px',   // diagonal down-right
      '-40px 40px',  // diagonal down-left
      '40px -40px',  // diagonal up-right
      '-40px -40px', // diagonal up-left
    ];

    const changeDirection = () => {
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      setGridDirection(randomDirection);
    };

    // Change direction every 8 seconds (matching animation cycle)
    const intervalId = setInterval(changeDirection, 8000);

    return () => clearInterval(intervalId);
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('pdf_file', selectedFile);

      // Add number of questions (default to 15 if not specified)
      const numQuestions = organizationMetadata.num_questions || 15;
      formData.append('num_questions', numQuestions.toString());
      formData.append('difficulty', 'medium');

      // Add quiz_title (use filename if not provided)
      const quizTitle = organizationMetadata.quiz_title || selectedFile.name.replace('.pdf', '');
      formData.append('quiz_title', quizTitle);

      // Add organization metadata if provided
      if (organizationMetadata.institution) {
        formData.append('institution', organizationMetadata.institution);
      }
      if (organizationMetadata.program) {
        formData.append('program', organizationMetadata.program);
      }
      if (organizationMetadata.course_code) {
        formData.append('course_code', organizationMetadata.course_code);
      }
      if (organizationMetadata.topic) {
        formData.append('topic', organizationMetadata.topic);
      }
      if (organizationMetadata.file_description) {
        formData.append('file_description', organizationMetadata.file_description);
      }

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Quiz generated successfully:', data);
        setQuizData(data);

        // Set context to generation
        setReviewContext('generation');

        // Go to review/approval state instead of saving immediately
        setAppState('reviewing-approval');
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

  const handleBackToHome = () => {
    setAppState('home');
    setSelectedFile(null);
    setOrganizationMetadata({});
    setQuizData(null);
    setFinalScore(null);
    setReviewData(null);
  };

  const handleTryAgain = () => {
    setAppState('taking-quiz');
    setFinalScore(null);
  };

  const handleViewHistory = () => {
    setAppState('history');
  };

  const handleViewQuizzes = () => {
    setAppState('quizzes');
  };

  const handleSelectQuizFromHistory = (
    quiz: QuizGenerationResponse,
    config?: SessionConfig,
    answers?: AnswerRecord[],
    sessionScore?: { correct: number; total: number }
  ) => {
    setQuizData(quiz);

    if (answers && sessionScore) {
      // Review mode - show past attempt
      setReviewData({ answers, sessionScore });
      setAppState('reviewing-quiz');
    } else {
      // No past attempt - take quiz fresh with config
      if (config) {
        setSessionConfig(config);
      }
      setReviewData(null);
      setAppState('taking-quiz');
    }
  };

  const handleSelectQuizFromBrowser = async (quizId: string, config: SessionConfig) => {
    try {
      const quiz = await getQuizById(quizId, user);
      if (quiz) {
        setQuizData(quiz);
        setSessionConfig(config);
        setReviewData(null); // Always start fresh from quiz browser
        setAppState('taking-quiz');
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert('Failed to load quiz. Please try again.');
    }
  };

  const handleRetakeQuiz = () => {
    setReviewData(null);
    setAppState('taking-quiz');
  };

  const handleApproveAndSave = async (finalQuizData: QuizGenerationResponse) => {
    try {
      // Save the quiz to database (automatically routes to localStorage or Supabase)
      await saveQuiz(finalQuizData, user);
      console.log('💾 Quiz saved successfully');

      // Update local state with final data
      setQuizData(finalQuizData);

      // Navigate based on context
      if (reviewContext === 'browser') {
        // Came from quiz browser - go back to browser
        setAppState('quizzes');
      } else {
        // Came from generation - go to approved screen
        setAppState('quiz-approved');
      }

      // Clear context
      setReviewContext(null);
    } catch (error) {
      console.error('⚠️ Failed to save quiz:', error);
      alert('Failed to save quiz. Please try again.');
    }
  };

  const handleCancelReview = () => {
    setQuizData(null);

    // Navigate based on context
    if (reviewContext === 'browser') {
      // Came from quiz browser - go back to browser (changes discarded)
      setAppState('quizzes');
    } else {
      // Came from generation - go back to generate screen (quiz not saved)
      setAppState('generate');
    }

    // Clear context
    setReviewContext(null);
  };

  const handleTakeApprovedQuiz = () => {
    setAppState('taking-quiz');
  };

  const handleGenerateNewAfterApproval = () => {
    setQuizData(null);
    setSelectedFile(null);
    setOrganizationMetadata({});
    setAppState('generate');
  };

  const handleCheckQuizzesAfterApproval = () => {
    setAppState('quizzes');
  };

  const handleReviewQuestionsFromBrowser = async (quizId: string) => {
    try {
      const quiz = await getQuizById(quizId, user);
      if (quiz) {
        setQuizData(quiz);
        setReviewContext('browser');
        setAppState('reviewing-approval');
      }
    } catch (error) {
      console.error('Failed to load quiz for review:', error);
      alert('Failed to load quiz. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-[0.15] pointer-events-none animate-grid-pan"
        style={{
          backgroundImage: `
            linear-gradient(to right, #3b82f6 1px, transparent 1px),
            linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          '--grid-end-position': gridDirection,
        } as React.CSSProperties & { '--grid-end-position': string }}
      ></div>

      {/* Content */}
      <div className="relative z-10">
      {/* Side Panel */}
      <SidePanel
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Hamburger Menu Button - Top left */}
      <div className="fixed top-4 left-4 z-30">
        <button
          onClick={() => setShowSidePanel(true)}
          className="bg-white hover:bg-gray-50 text-gray-700 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-lg transition-colors"
          aria-label="Menu"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Info Bubble - Always visible in upper right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          {/* Info Icon Button - Smaller on mobile */}
          <button
            onClick={() => setShowInfoBubble(!showInfoBubble)}
            className="bg-blue-600 text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Information"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Info Popup - Responsive width and positioning */}
          {showInfoBubble && (
            <div className="absolute top-14 right-0 w-[calc(100vw-2rem)] max-w-[20rem] md:w-80 bg-white rounded-lg shadow-xl p-4 md:p-6 border-2 border-blue-200">
              {/* Close button */}
              <button
                onClick={() => setShowInfoBubble(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">
                Feedback & Support
              </h3>
              <p className="text-xs md:text-sm text-gray-700 mb-3 md:mb-4">
                Have feedback or a feature request? We'd love to hear from you!
              </p>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Contact the developer:</p>
                <a
                  href="mailto:my.stationptot@gmail.com"
                  className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium break-all"
                >
                  my.stationptot@gmail.com
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Home Screen - 3 Buttons */}
        {appState === 'home' && (
          <div className="max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                QuizMe
              </h1>
              <p className="text-lg md:text-xl text-gray-600">
                Generate practice quizzes from your PDF learning materials using AI
              </p>
            </div>

            {/* 3 Main Buttons - Stack on mobile, grid on desktop */}
            <div className="flex flex-col sm:grid sm:grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Generate Quiz Button */}
              <button
                onClick={() => setAppState('generate')}
                className="bg-white rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
              >
                <div className="bg-blue-100 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Generate Quiz</h3>
                <p className="text-sm text-gray-600">
                  Upload a PDF and create a new quiz
                </p>
              </button>

              {/* Quizzes Button */}
              <button
                onClick={() => setAppState('quizzes')}
                className="bg-white rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
              >
                <div className="bg-indigo-100 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-indigo-200 transition-colors">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Quizzes</h3>
                <p className="text-sm text-gray-600">
                  Browse and take available quizzes
                </p>
              </button>

              {/* Quiz History Button */}
              <button
                onClick={() => setAppState('history')}
                className="bg-white rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
              >
                <div className="bg-purple-100 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Quiz History</h3>
                <p className="text-sm text-gray-600">
                  View past quiz attempts and scores
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Generate Quiz Screen */}
        {appState === 'generate' && (
          <div className="max-w-2xl mx-auto px-4">
            {/* Back Button - Larger for touch */}
            <button
              onClick={handleBackToHome}
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 min-h-[44px] text-base md:text-sm font-medium"
            >
              <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>

            {/* Header - Mobile responsive */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Generate a Quiz
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                Upload a PDF and we'll create practice questions for you
              </p>
            </div>

            {/* Upload Zone */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <FileUploadZone
                onFileSelect={handleFileSelect}
                onMetadataChange={setOrganizationMetadata}
                user={user}
              />

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
          </div>
        )}

        {/* Quizzes Screen - Browse available quizzes */}
        {appState === 'quizzes' && (
          <div className="max-w-4xl mx-auto px-4">
            {/* Back Button - Larger for touch */}
            <button
              onClick={handleBackToHome}
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 min-h-[44px] text-base md:text-sm font-medium"
            >
              <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>

            {/* Header - Mobile responsive */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Available Quizzes
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                Browse and take your generated quizzes
              </p>
            </div>

            {/* Quiz Browser Component */}
            <QuizBrowser
              onSelectQuiz={handleSelectQuizFromBrowser}
              onBack={handleBackToHome}
              onReviewQuestions={handleReviewQuestionsFromBrowser}
              user={user}
            />
          </div>
        )}

        {/* Reviewing/Approval State - Review questions before saving */}
        {appState === 'reviewing-approval' && quizData && (
          <QuizReviewApproval
            quizData={quizData}
            onApproveAndSave={handleApproveAndSave}
            onCancel={handleCancelReview}
          />
        )}

        {/* Quiz Approved State - Show what's next options */}
        {appState === 'quiz-approved' && quizData && (
          <QuizApprovedScreen
            quizTitle={quizData.quiz_title}
            questionCount={quizData.questions.length}
            onTakeQuiz={handleTakeApprovedQuiz}
            onGenerateNew={handleGenerateNewAfterApproval}
            onCheckQuizzes={handleCheckQuizzesAfterApproval}
          />
        )}

        {/* Taking Quiz State */}
        {appState === 'taking-quiz' && quizData && (
          <QuizDisplay
            quizData={quizData}
            config={sessionConfig ?? undefined}
            onComplete={handleQuizComplete}
            onBack={handleBackToHome}
            user={user}
          />
        )}

        {/* History State */}
        {appState === 'history' && (
          <div className="max-w-4xl mx-auto px-4">
            {/* Back Button - Larger for touch */}
            <button
              onClick={handleBackToHome}
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 min-h-[44px] text-base md:text-sm font-medium"
            >
              <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>

            {/* Header - Mobile responsive */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Quiz History
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                Review your past quiz attempts and scores
              </p>
            </div>

            <QuizHistory
              onSelectQuiz={handleSelectQuizFromHistory}
              onBack={handleBackToHome}
              user={user}
            />
          </div>
        )}

        {/* Reviewing Quiz State - Show past attempt */}
        {appState === 'reviewing-quiz' && quizData && reviewData && (
          <QuizReview
            quizData={quizData}
            answers={reviewData.answers}
            sessionScore={reviewData.sessionScore}
            onRetake={handleRetakeQuiz}
            onBack={handleBackToHome}
          />
        )}

        {/* Results State */}
        {appState === 'results' && quizData && finalScore && (
          <QuizResults
            score={finalScore.score}
            total={finalScore.total}
            quizTitle={quizData.quiz_title || quizData.file_name || 'Generated Quiz'}
            onTryAgain={handleTryAgain}
            onBackHome={handleBackToHome}
          />
        )}
      </div>
      </div>
    </main>
  );
}

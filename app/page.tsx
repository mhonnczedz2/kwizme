'use client';

import { useState, useEffect, useRef } from 'react';
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
import FeedbackDrawer from '@/components/FeedbackDrawer';
import GeneratingQuiz from '@/components/GeneratingQuiz';
import ThemeToggle from '@/components/ThemeToggle';
import { QuizGenerationResponse, AnswerRecord } from '@/lib/db/types';
import { SessionConfig } from '@/components/QuizConfigModal';
import { saveQuiz, getQuizById } from '@/lib/storage-router';
import { seedDefaultQuizzes } from '@/lib/db/quiz-storage';

type AppState = 'home' | 'generate' | 'quizzes' | 'history' | 'reviewing-approval' | 'quiz-approved' | 'taking-quiz' | 'reviewing-quiz' | 'results';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const [appState, setAppState] = useState<AppState>('home');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [organizationMetadata, setOrganizationMetadata] = useState<OrganizationMetadata>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
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
  const [helpfulTip, setHelpfulTip] = useState('');

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

  // Pool of helpful tips, motivational messages, and jokes (175 total)
  const helpfulTips = [
    // App usage tips (8)
    "💡 You can upload PDFs, Word docs, PowerPoint presentations, Excel files, images, and text files to generate quizzes!",
    "🎯 Review your quiz questions before saving - you can edit them to better match your learning goals.",
    "📊 Check your Quiz History to track your progress and see which topics need more practice.",
    "🔄 Retake quizzes as many times as you want - repetition is key to mastering the material!",
    "✏️ Add institution, program, and course details when generating quizzes to keep them organized.",
    "📝 The app supports files up to 20MB - perfect for comprehensive study materials.",
    "🎲 Use the quiz browser to find all your saved quizzes in one place.",
    "⚡ Generate multiple quizzes from the same material with different difficulty levels for progressive learning.",

    // Study and learning tips (17)
    "📚 Active recall through quizzing is proven to be more effective than passive reading.",
    "🧠 Study tip: Space out your practice sessions over several days for better long-term retention.",
    "⏰ Take quizzes at different times of day to strengthen memory formation.",
    "🎓 Research shows that testing yourself is one of the most effective study techniques.",
    "💪 Making mistakes is part of learning - review wrong answers to understand concepts better.",
    "🌟 Break large topics into smaller quizzes to avoid cognitive overload.",
    "🔍 Review explanations for both correct and incorrect answers to deepen understanding.",
    "📖 Combine quiz practice with other study methods like summarizing and teaching others.",
    "🎯 Focus on understanding 'why' an answer is correct, not just memorizing facts.",
    "⭐ Regular short quiz sessions are more effective than long cramming sessions.",
    "🚀 Use quiz results to identify weak areas and target your study time efficiently.",
    "💡 Explain quiz answers out loud to yourself - teaching reinforces learning.",
    "🔄 Revisit quizzes weeks later to test long-term retention.",
    "📊 Track your scores over time to see your improvement and stay motivated.",
    "🎨 Mix different subjects and topics in your study sessions for better learning.",
    "⚡ Take quizzes before exams to boost confidence and identify last-minute review needs.",
    "🌈 Learning is a journey - celebrate small wins and progress along the way!",

    // Additional motivational tips (25)
    "🌟 Every expert was once a beginner - you're on the right path!",
    "💎 Your mind is like a muscle - the more you exercise it, the stronger it becomes!",
    "🎯 Consistency beats intensity - small daily efforts lead to big results!",
    "🌱 Growth happens outside your comfort zone. Embrace the challenge!",
    "✨ Believe in yourself - you're capable of more than you think!",
    "🔥 Your only competition is the person you were yesterday!",
    "🎓 Education is not preparation for life - education IS life!",
    "💫 The secret of getting ahead is getting started!",
    "🌈 Difficult roads often lead to beautiful destinations!",
    "⚡ Success is the sum of small efforts repeated day in and day out!",
    "🎪 Make learning fun - curiosity is the engine of achievement!",
    "🏆 You don't have to be perfect to be amazing!",
    "🌻 Every question you answer is a step closer to your goals!",
    "💪 You're not here to be average, you're here to be awesome!",
    "🎨 Your potential is endless - keep pushing forward!",
    "🚀 Dream big, study hard, stay focused!",
    "🌟 The future belongs to those who believe in their dreams!",
    "💝 Be patient with yourself - progress is progress, no matter how small!",
    "🎯 You miss 100% of the quizzes you don't take!",
    "🔮 Your breakthrough is on the other side of your breakthrough effort!",
    "🌸 Strive for progress, not perfection!",
    "⭐ The only way to do great work is to love what you learn!",
    "🎭 Turn your can'ts into cans and your dreams into plans!",
    "🌺 You are braver than you believe and smarter than you think!",
    "💖 Keep going - you're doing better than you realize!",

    // Light-hearted jokes in English (50)
    "😄 Why did the student eat their homework? The teacher said it was a piece of cake!",
    "🤣 What's a math teacher's favorite place? Times Square!",
    "😂 Why don't scientists trust atoms? Because they make up everything!",
    "😆 What do you call a bear with no teeth? A gummy bear!",
    "😄 Why did the scarecrow become a successful student? He was outstanding in his field!",
    "🤣 What's the king of all school supplies? The ruler!",
    "😂 Why did the book join the police? It wanted to go undercover!",
    "😆 What do you call a snowman with a six-pack? An abdominal snowman!",
    "😄 Why can't you trust an atom? They literally make up everything!",
    "🤣 What do you call a fake noodle? An impasta!",
    "😂 Why did the bicycle fall over? It was two-tired!",
    "😆 What do you call a sleeping bull? A bulldozer!",
    "😄 Why did the coffee file a police report? It got mugged!",
    "🤣 What do you call a fish without eyes? A fsh!",
    "😂 Why don't eggs tell jokes? They'd crack up!",
    "😆 What's orange and sounds like a parrot? A carrot!",
    "😄 Why did the math book look so sad? It had too many problems!",
    "🤣 What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!",
    "😂 Why couldn't the bicycle stand up? It was two tired!",
    "😆 What do you call cheese that isn't yours? Nacho cheese!",
    "😄 Why did the golfer bring two pairs of pants? In case he got a hole in one!",
    "🤣 What do you call a can opener that doesn't work? A can't opener!",
    "😂 Why did the computer go to the doctor? It had a virus!",
    "😆 What do you call a belt made of watches? A waist of time!",
    "😄 Why did the tomato turn red? Because it saw the salad dressing!",
    "🤣 What do you call a lazy kangaroo? A pouch potato!",
    "😂 Why don't skeletons fight each other? They don't have the guts!",
    "😆 What do you call a boomerang that won't come back? A stick!",
    "😄 Why did the cookie go to the hospital? It felt crumbly!",
    "🤣 What do you call a train that sneezes? Achoo-choo train!",
    "😂 Why did the banana go to the doctor? It wasn't peeling well!",
    "😆 What do you call a bear in the rain? A drizzly bear!",
    "😄 Why did the stadium get hot? All the fans left!",
    "🤣 What do you call a pile of cats? A meowtain!",
    "😂 Why don't oysters donate to charity? Because they're shellfish!",
    "😆 What do you call a singing laptop? A Dell!",
    "😄 Why did the chicken go to the seance? To talk to the other side!",
    "🤣 What do you call a group of musical whales? An orca-stra!",
    "😂 Why did the picture go to jail? It was framed!",
    "😆 What do you call a nervous javelin thrower? Shakespeare!",
    "😄 Why don't calendars ever win races? They always have too many dates!",
    "🤣 What do you call a cow with no legs? Ground beef!",
    "😂 Why did the smartphone need glasses? It lost all its contacts!",
    "😆 What do you call a sleeping pizza? A piZZZa!",
    "😄 Why don't some couples go to the gym? Because some relationships don't work out!",
    "🤣 What do you call a magical dog? A labracadabrador!",
    "😂 Why did the invisible man turn down the job? He couldn't see himself doing it!",
    "😆 What do you call a sad coffee? A depresso!",
    "😄 Why don't mountains ever get cold? They have snow caps!",
    "🤣 What do you call a sleeping dinosaur? A dino-snore!",

    // Light-hearted jokes in Filipino - Pure Tagalog (25)
    "😄 Bakit laging natatalo ang kalabaw sa quiz? Kasi siya ay bago sa lahat!",
    "🤣 Ano ang tawag sa estudyanteng mahilig sa sayaw? Mag-aaral na may ritmo!",
    "😂 Bakit ayaw mag-aral ng ibon? Kasi gusto niya mag-fly lang ng grades!",
    "😆 Ano ang paboritong subject ng bampira? Dugo-nometry!",
    "😄 Bakit mahilig mag-aral ang pusa? Para maging honors-cat!",
    "🤣 Ano ang tawag sa masipag na isda? Grade-conscious na tilapia!",
    "😂 Bakit nag-aaral ang mangga? Para hindi maging hinog na walang alam!",
    "😆 Ano ang paboritong libro ng manok? Kwentong may saysay!",
    "😄 Bakit sumama ang lapis sa eskwela? Gusto niyang maging sharp!",
    "🤣 Ano ang tawag sa ulan na mahilig sa math? Precipi-tayo ng problema!",
    "😂 Bakit masaya ang eraser? Kasi marunong siyang mag-move on!",
    "😆 Ano ang ginagawa ng plantsa sa library? Nag-aaral ng pressed issues!",
    "😄 Bakit nag-aaral ang tsokolate? Para maging bitter-sweet success!",
    "🤣 Ano ang tawag sa bato na matalino? Rock-olar!",
    "😂 Bakit sumama ang hangin sa quiz bee? Para ipakita ang hangin-aling niya!",
    "😆 Ano ang paboritong subject ng asin? Chemis-try niya lahat!",
    "😄 Bakit ayaw mag-exam ng kamatis? Takot siyang ma-crush!",
    "🤣 Ano ang tawag sa matalinong patatas? Brainy chips!",
    "😂 Bakit nag-aaral ang bola? Para hindi maging bilog lang ang ulo!",
    "😆 Ano ang ginagawa ng bituin sa klase? Sumasagot ng twinkling stars!",
    "😄 Bakit masipag ang prutas? Gusto nilang maging fruitful ang buhay!",
    "🤣 Ano ang tawag sa matalinong bubuyog? Bee-yani!",
    "😂 Bakit nag-aaral ang ulap? Para hindi maging malabo ang kinabukasan!",
    "😆 Ano ang paboritong subject ng dilim? Shadow-nomics!",
    "😄 Bakit sumama ang tuwa sa eskwela? Para mag-enjoy habang nag-aaral!",

    // Light-hearted jokes in Filipino - Taglish (25)
    "😄 Bakit late si Juan sa exam? Nag-cram kasi siya sa cram-poline!",
    "🤣 Ano ang tawag sa student na mahilig sa Japanese food? Honor roll na may tempura-ment!",
    "😂 Teacher: Bakit wala kang assignment? Student: Sorry ma'am, na-save ko kasi sa cloud... yung rain cloud!",
    "😆 Bakit nag-aaral si Pedro ng English? Para ma-gets niya ang memes!",
    "😄 Ano ang favorite subject ng Pinoy? Recess, kasi break time na!",
    "🤣 Bakit pumasa si Maria sa Math? Kasi nag-pray siya na mag-multiply ang blessings!",
    "😂 What's the difference between homework at home work? Isa pinapasa, isa hindi tapos-tapos!",
    "😆 Bakit favorite ng students ang Friday? Kasi feel na feel na nila ang weekend vibes!",
    "😄 Teacher: Anong formula ng success? Student: Ma'am, Ctrl+C plus Ctrl+V... joke lang po!",
    "🤣 Bakit nag-fail si Dodong? Nag-focus kasi siya sa camera instead of books!",
    "😂 Ano ang study habit ng millennial? Mag-scroll ng TikTok habang may textbook sa tabi!",
    "😆 Bakit ayaw mag-recite ni Berto? Kasi introvert siya, gusto niya chat lang!",
    "😄 What's a Filipino student's prayer? Sana mag-curve ang grades!",
    "🤣 Bakit happy si Inday sa quiz? Kasi multiple choice - may fifty-fifty pa!",
    "😂 Teacher: Submit your paper! Student: Ma'am wait, nag-lo-load pa po!",
    "😆 Ano ang motto ng students? Bahala na si Batman, pero sana si Superman na lang!",
    "😄 Bakit mahilig sa group study ang Pinoy? Para may ma-copy... I mean, ma-collaborate!",
    "🤣 What do you call a Filipino student's favorite button? The snooze button!",
    "😂 Bakit nag-aaral ng Science si Tony? Para ma-gets niya why may chemistry sila ni Maria!",
    "😆 Teacher: Early bird gets the worm! Student: Ma'am, pwede na po yung late night snack!",
    "😄 Ano ang battle cry ng students? Kaya natin 'to! After ng one more episode!",
    "🤣 Bakit nag-attend ng class si Gina? Para ma-justify ang WiFi bill!",
    "😂 What's a student's favorite exercise? Mental gymnastics para sa excuses!",
    "😆 Bakit nag-aaral si Carlo ng History? Para hindi mag-repeat ang kamalian... ng grades niya!",
    "😄 Teacher: Think outside the box! Student: Ma'am, pwede po bang think inside the aircon room?"
  ];

  // Select random tip on component mount and when returning to home
  useEffect(() => {
    if (appState === 'home') {
      const randomTip = helpfulTips[Math.floor(Math.random() * helpfulTips.length)];
      setHelpfulTip(randomTip);
    }
  }, [appState]);

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
    setGenerationError(null);

    try {
      const formData = new FormData();
      formData.append('pdf_file', selectedFile);

      // Add number of questions (default to 15 if not specified)
      const numQuestions = organizationMetadata.num_questions || 15;
      formData.append('num_questions', numQuestions.toString());
      formData.append('difficulty', 'medium');

      // Add quiz_title (use filename if not provided)
      const quizTitle = organizationMetadata.quiz_title || selectedFile.name.replace(/\.[^/.]+$/, '');
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
        // Set appropriate error code based on response
        if (data.error?.includes('parse') || data.error?.includes('read')) {
          setGenerationError('PDF_PARSE_ERROR');
        } else if (data.error?.includes('rate') || data.error?.includes('limit')) {
          setGenerationError('RATE_LIMIT');
        } else {
          setGenerationError(data.error || 'Failed to generate quiz');
        }
      }
    } catch (error) {
      console.error('❌ Quiz generation error:', error);
      setGenerationError('API_ERROR');
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
    setGenerationError(null);
  };

  const handleRetryGeneration = () => {
    setGenerationError(null);
    handleGenerateQuiz();
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
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Fixed Background Layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"></div>

      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none animate-grid-pan"
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

      {/* Feedback Drawer */}
      <FeedbackDrawer
        isOpen={showInfoBubble}
        onClose={() => setShowInfoBubble(false)}
      />

      {/* Top Bar - Visible on all screen sizes */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-3 items-center gap-2 px-4 lg:px-6 py-2 lg:py-3">
          <div className="flex items-center justify-start">
            <button
              onClick={() => setShowSidePanel(true)}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center shadow transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent text-center">
            QuizMe
          </h1>

          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
            <button
              onClick={() => setShowInfoBubble(true)}
              className="bg-blue-600 dark:bg-blue-700 text-white rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              aria-label="Feedback"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 lg:pt-32">
        {/* Home Screen - 3 Buttons */}
        {appState === 'home' && (
          <div className="max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                QuizMe
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                Generate practice quizzes from your learning materials using AI
              </p>
            </div>

            {/* 3 Main Buttons - Stack on mobile, grid on desktop */}
            <div className="flex flex-col sm:grid sm:grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Generate Quiz Button */}
              <button
                onClick={() => setAppState('generate')}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
              >
                <div className="bg-blue-100 dark:bg-blue-900/30 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Generate Quiz</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload your learning materials and create a new quiz
                </p>
              </button>

              {/* Quizzes Button */}
              <button
                onClick={() => setAppState('quizzes')}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
              >
                <div className="bg-indigo-100 dark:bg-indigo-900/30 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Quizzes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Browse and take available quizzes
                </p>
              </button>

              {/* Quiz History Button */}
              <button
                onClick={() => setAppState('history')}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
              >
                <div className="bg-purple-100 dark:bg-purple-900/30 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Quiz History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View past quiz attempts and scores
                </p>
              </button>
            </div>

            {/* Helpful Tip Section */}
            <div className="mt-8 md:mt-12">
              <p className="text-sm md:text-base text-gray-900 dark:text-gray-100 text-center leading-relaxed font-medium px-4">
                {helpfulTip}
              </p>
            </div>
          </div>
        )}

        {/* Generate Quiz Screen */}
        {appState === 'generate' && (
          <div className="max-w-2xl mx-auto px-4 overflow-x-hidden">
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
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Generate a Quiz
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                Upload your learning materials and we'll create practice questions for you
              </p>
            </div>

            {/* Upload Zone */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-8">
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
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
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
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
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

      {/* Loading/Error Overlay - Shows during quiz generation */}
      {(isGenerating || generationError) && (
        <GeneratingQuiz
          error={generationError}
          onRetry={handleRetryGeneration}
        />
      )}
      </div>
    </main>
  );
}

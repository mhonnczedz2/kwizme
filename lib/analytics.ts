/**
 * Analytics utility functions for KwizMe
 * Provides type-safe event tracking for Google Analytics 4, Sentry error monitoring, and Discord alerts
 */

import * as Sentry from '@sentry/nextjs';
import { sendDiscordErrorAlert } from './discord-alerts';
import { sendUserSignupNotification, sendQuizGenerationNotification } from './discord-notifications';

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Generic event tracking function
 * Only sends events in production to avoid polluting analytics with development data
 */
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag && process.env.NODE_ENV === 'production') {
    window.gtag('event', eventName, {
      ...parameters,
      // Add timestamp for better event tracking
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Quiz Generation Events - Enhanced with Discord notifications
 */
export const trackQuizGenerated = async (params: {
  fileType: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  userType: 'anonymous' | 'authenticated';
  pageCount?: number;
  fileSize?: number;
  quizTitle?: string; // For Discord notifications
}) => {
  // Track in GA4
  trackEvent('quiz_generated', {
    file_type: params.fileType,
    difficulty: params.difficulty,
    num_questions: params.numQuestions,
    user_type: params.userType,
    page_count: params.pageCount,
    file_size_mb: params.fileSize ? Math.round(params.fileSize / (1024 * 1024) * 100) / 100 : undefined,
    event_category: 'quiz_generation',
  });

  // Send Discord notification for successful quiz generation
  try {
    await sendQuizGenerationNotification({
      fileType: params.fileType,
      difficulty: params.difficulty,
      numQuestions: params.numQuestions,
      userType: params.userType,
      fileSize: params.fileSize,
      quizTitle: params.quizTitle,
      timestamp: new Date().toISOString()
    });
  } catch (discordError) {
    // Don't fail the quiz generation process if Discord fails
    console.warn('Failed to send Discord quiz generation notification:', discordError);
  }
};

/**
 * Quiz Completion Events
 */
export const trackQuizCompleted = (params: {
  quizId: string;
  score: number;
  totalQuestions: number;
  mode: string;
  timeSpent: number;
  completionRate: number;
}) => {
  trackEvent('quiz_completed', {
    quiz_id: params.quizId,
    score: params.score,
    total_questions: params.totalQuestions,
    score_percentage: Math.round((params.score / params.totalQuestions) * 100),
    mode: params.mode,
    time_spent_seconds: params.timeSpent,
    completion_rate: params.completionRate,
    event_category: 'quiz_engagement',
  });
};

/**
 * User Registration Events - Enhanced with Discord notifications
 */
export const trackUserSignup = async (params: {
  source?: string;
  referrer?: string;
  hasExistingData?: boolean;
  email?: string; // For Discord notifications
}) => {
  // Track in GA4
  trackEvent('user_signup', {
    source: params.source || 'direct',
    referrer: params.referrer,
    has_existing_data: params.hasExistingData,
    event_category: 'user_lifecycle',
  });

  // Send Discord notification for new user signup
  try {
    await sendUserSignupNotification({
      email: params.email, // Email for notification context (will be spoiler-tagged)
      source: params.source || 'direct',
      referrer: params.referrer,
      hasExistingData: params.hasExistingData,
      timestamp: new Date().toISOString()
    });
  } catch (discordError) {
    // Don't fail the signup process if Discord fails
    console.warn('Failed to send Discord signup notification:', discordError);
  }
};

/**
 * Rate Limiting Events
 */
export const trackRateLimitHit = (params: {
  currentCount: number;
  dailyLimit: number;
  userType: 'anonymous' | 'authenticated';
  planType?: string;
}) => {
  trackEvent('rate_limit_hit', {
    current_count: params.currentCount,
    daily_limit: params.dailyLimit,
    user_type: params.userType,
    plan_type: params.planType || 'free',
    event_category: 'monetization',
  });
};

/**
 * Premium Upgrade Events
 */
export const trackPremiumUpgrade = (params: {
  fromPlan: string;
  toPlan: string;
  trigger: 'rate_limit' | 'feature_gate' | 'marketing' | 'other';
  upgradeValue?: number;
}) => {
  trackEvent('premium_upgrade', {
    from_plan: params.fromPlan,
    to_plan: params.toPlan,
    trigger: params.trigger,
    upgrade_value: params.upgradeValue,
    event_category: 'monetization',
  });
};

/**
 * File Upload Events
 */
export const trackFileUploaded = (params: {
  fileType: string;
  fileSizeMB: number;
  pageCount?: number;
  processingTime?: number;
}) => {
  trackEvent('file_uploaded', {
    file_type: params.fileType,
    file_size_mb: params.fileSizeMB,
    page_count: params.pageCount,
    processing_time_ms: params.processingTime,
    event_category: 'file_processing',
  });
};

/**
 * Quiz Interaction Events
 */
export const trackQuizStarted = (params: {
  quizId: string;
  mode: string;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  numQuestions: number;
}) => {
  trackEvent('quiz_started', {
    quiz_id: params.quizId,
    mode: params.mode,
    randomize_questions: params.randomizeQuestions,
    randomize_options: params.randomizeOptions,
    num_questions: params.numQuestions,
    event_category: 'quiz_engagement',
  });
};

/**
 * Question Interaction Events
 */
export const trackQuestionAnswered = (params: {
  quizId: string;
  questionIndex: number;
  isCorrect: boolean;
  timeSpent: number;
  hintUsed?: boolean;
}) => {
  trackEvent('question_answered', {
    quiz_id: params.quizId,
    question_index: params.questionIndex,
    is_correct: params.isCorrect,
    time_spent_seconds: params.timeSpent,
    hint_used: params.hintUsed || false,
    event_category: 'quiz_engagement',
  });
};

/**
 * Feedback Events
 */
export const trackFeedbackSubmitted = (params: {
  rating?: number;
  feedbackType: 'bug' | 'feature' | 'general' | 'rating';
  source: 'post_quiz' | 'error_state' | 'rate_limit' | 'header' | 'support_page';
  hasText: boolean;
}) => {
  trackEvent('feedback_submitted', {
    rating: params.rating,
    feedback_type: params.feedbackType,
    source: params.source,
    has_text: params.hasText,
    event_category: 'user_feedback',
  });
};

/**
 * Page View Events (for SPA navigation)
 */
export const trackPageView = (pageName: string, additionalParams?: Record<string, any>) => {
  trackEvent('page_view', {
    page_name: pageName,
    ...additionalParams,
    event_category: 'navigation',
  });
};

/**
 * Error Events - Enhanced with Sentry integration and Discord alerts
 */
export const trackError = async (params: {
  errorType: 'api_error' | 'client_error' | 'network_error' | 'validation_error';
  errorMessage: string;
  errorCode?: string | number;
  context?: string;
  error?: Error; // Actual error object for Sentry
  userId?: string; // For Discord context
  sessionId?: string; // For Discord context
  url?: string; // For Discord context
  userAgent?: string; // For Discord context
}) => {
  // Track in GA4
  trackEvent('error_occurred', {
    error_type: params.errorType,
    error_message: params.errorMessage.substring(0, 100), // Limit message length
    error_code: params.errorCode,
    context: params.context,
    event_category: 'errors',
  });

  // Also send to Sentry with additional context
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', params.errorType);
      scope.setTag('context', params.context || 'unknown');
      if (params.errorCode) {
        scope.setTag('errorCode', params.errorCode.toString());
      }
      scope.setLevel('error');

      // Capture the actual error object or create one from the message
      if (params.error) {
        Sentry.captureException(params.error);
      } else {
        Sentry.captureMessage(params.errorMessage, 'error');
      }
    });
  }

  // Send Discord alerts for critical errors
  // Determine severity based on error type
  let shouldAlert = false;
  let alertType: 'critical' | 'warning' | 'info' = 'info';

  switch (params.errorType) {
    case 'api_error':
      // API errors are critical as they affect core functionality
      shouldAlert = true;
      alertType = 'critical';
      break;
    case 'network_error':
      // Network errors might indicate service issues
      shouldAlert = true;
      alertType = 'warning';
      break;
    case 'client_error':
      // Client errors are warnings (could be browser/user environment issues)
      shouldAlert = true;
      alertType = 'warning';
      break;
    case 'validation_error':
      // Validation errors are typically user input issues, don't alert
      shouldAlert = false;
      break;
  }

  // Send Discord alert if appropriate
  if (shouldAlert) {
    try {
      await sendDiscordErrorAlert({
        errorType: alertType,
        title: `${params.errorType.toUpperCase()}: ${params.context || 'Unknown Context'}`,
        message: params.errorMessage,
        errorCode: params.errorCode?.toString(),
        userId: params.userId,
        sessionId: params.sessionId,
        context: params.context,
        stack: params.error?.stack,
        userAgent: params.userAgent,
        url: params.url,
        timestamp: new Date().toISOString()
      });
    } catch (discordError) {
      // Don't fail the original error handling if Discord fails
      console.warn('Failed to send Discord error alert:', discordError);
    }
  }
};
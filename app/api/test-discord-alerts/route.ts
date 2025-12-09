import { NextRequest, NextResponse } from 'next/server';
import { trackError, trackUserSignup, trackQuizGenerated } from '@/lib/analytics';
import { IncidentTracker } from '@/lib/monitoring';
import { sendDiscordErrorAlert, sendCriticalError, sendWarningError } from '@/lib/discord-alerts';
import { sendUserSignupNotification, sendQuizGenerationNotification } from '@/lib/discord-notifications';

// Set runtime timeout
export const maxDuration = 30; // 30 seconds max

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, message = 'Test error message' } = body;

    if (!testType) {
      return NextResponse.json({
        error: 'testType is required',
        availableTypes: ['analytics', 'monitoring', 'direct', 'critical', 'warning', 'signup', 'quiz', 'signup-direct', 'quiz-direct']
      }, { status: 400 });
    }

    console.log(`🧪 Testing Discord error alerts: ${testType}`);

    switch (testType) {
      case 'analytics':
        // Test the trackError function from analytics.ts
        await trackError({
          errorType: 'api_error',
          errorMessage: `[TEST] Analytics error: ${message}`,
          errorCode: 'TEST_ERROR_001',
          context: 'discord_alert_test',
          userId: 'test-user-123',
          sessionId: 'test-session-456',
          url: '/api/test-discord-alerts',
          userAgent: 'Test User Agent',
          error: new Error(`Test error from analytics: ${message}`)
        });
        break;

      case 'monitoring':
        // Test the IncidentTracker.trackError method
        await IncidentTracker.trackError(
          new Error(`[TEST] Monitoring error: ${message}`),
          'discord_alert_test',
          {
            errorCode: 'TEST_ERROR_002',
            userId: 'test-user-123',
            sessionId: 'test-session-456',
            testData: 'This is test metadata'
          }
        );
        break;

      case 'direct':
        // Test the sendDiscordErrorAlert function directly
        await sendDiscordErrorAlert({
          errorType: 'critical',
          title: '[TEST] Direct Discord Alert',
          message: `Direct test message: ${message}`,
          errorCode: 'TEST_ERROR_003',
          userId: 'test-user-123',
          sessionId: 'test-session-456',
          context: 'direct_discord_test',
          stack: new Error('Test stack trace').stack,
          userAgent: 'Test User Agent',
          url: '/api/test-discord-alerts',
          timestamp: new Date().toISOString()
        });
        break;

      case 'critical':
        // Test the sendCriticalError helper
        await sendCriticalError(
          '[TEST] Critical Error Helper',
          new Error(`Critical test error: ${message}`),
          {
            context: 'critical_error_test',
            userId: 'test-user-123',
            sessionId: 'test-session-456',
            errorCode: 'TEST_ERROR_004'
          }
        );
        break;

      case 'warning':
        // Test the sendWarningError helper
        await sendWarningError(
          '[TEST] Warning Error Helper',
          `Warning test message: ${message}`,
          {
            context: 'warning_error_test',
            userId: 'test-user-123',
            sessionId: 'test-session-456',
            errorCode: 'TEST_ERROR_005'
          }
        );
        break;

      case 'signup':
        // Test the trackUserSignup function with Discord notifications
        await trackUserSignup({
          source: 'test',
          referrer: 'discord-test',
          hasExistingData: false,
          email: `test-user-${Date.now()}@example.com`
        });
        break;

      case 'quiz':
        // Test the trackQuizGenerated function with Discord notifications
        await trackQuizGenerated({
          fileType: 'application/pdf',
          difficulty: 'medium',
          numQuestions: 10,
          userType: 'authenticated',
          fileSize: 2048576, // 2MB
          quizTitle: `[TEST] Quiz: ${message}`
        });
        break;

      case 'signup-direct':
        // Test the sendUserSignupNotification function directly
        await sendUserSignupNotification({
          email: `direct-test-user-${Date.now()}@example.com`,
          source: 'direct_test',
          referrer: 'discord-notification-test',
          hasExistingData: false,
          timestamp: new Date().toISOString()
        });
        break;

      case 'quiz-direct':
        // Test the sendQuizGenerationNotification function directly
        await sendQuizGenerationNotification({
          fileType: 'application/pdf',
          difficulty: 'hard',
          numQuestions: 15,
          userType: 'authenticated',
          fileSize: 1024768, // 1MB
          quizTitle: `[TEST DIRECT] Quiz Generation: ${message}`,
          timestamp: new Date().toISOString()
        });
        break;

      default:
        return NextResponse.json({
          error: `Unknown test type: ${testType}`,
          availableTypes: ['analytics', 'monitoring', 'direct', 'critical', 'warning', 'signup', 'quiz', 'signup-direct', 'quiz-direct']
        }, { status: 400 });
    }

    console.log(`✅ Discord alert test completed: ${testType}`);

    return NextResponse.json({
      success: true,
      message: `Discord alert test '${testType}' executed successfully`,
      testType,
      timestamp: new Date().toISOString(),
      note: 'Check your Discord channels for the alerts. Error alerts go to DISCORD_ERROR_WEBHOOK_URL, positive notifications go to DISCORD_NOTIFICATIONS_WEBHOOK_URL.'
    });

  } catch (error) {
    console.error('❌ Discord alert test failed:', error);

    // Try to send a Discord alert about the test failure
    try {
      await sendCriticalError(
        '[TEST FAILURE] Discord Alert Test Failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          context: 'discord_alert_test_failure',
          errorCode: 'TEST_FAILURE'
        }
      );
    } catch (discordError) {
      console.error('❌ Failed to send Discord alert about test failure:', discordError);
    }

    return NextResponse.json({
      success: false,
      error: 'Discord alert test failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Discord Alert & Notification Test Endpoint',
    description: 'Use POST method to test Discord error alerts and positive notifications',
    usage: {
      method: 'POST',
      body: {
        testType: 'analytics | monitoring | direct | critical | warning | signup | quiz | signup-direct | quiz-direct',
        message: 'Optional custom test message'
      }
    },
    categories: {
      errorAlerts: {
        webhook: 'DISCORD_ERROR_WEBHOOK_URL',
        types: ['analytics', 'monitoring', 'direct', 'critical', 'warning'],
        description: 'Test error alerts and critical notifications'
      },
      positiveNotifications: {
        webhook: 'DISCORD_NOTIFICATIONS_WEBHOOK_URL',
        types: ['signup', 'quiz', 'signup-direct', 'quiz-direct'],
        description: 'Test celebratory notifications for user signups and quiz generations'
      }
    },
    examples: [
      {
        description: 'Test analytics trackError function',
        body: { testType: 'analytics', message: 'Testing analytics error tracking' }
      },
      {
        description: 'Test monitoring IncidentTracker',
        body: { testType: 'monitoring', message: 'Testing incident tracker' }
      },
      {
        description: 'Test direct Discord alert',
        body: { testType: 'direct', message: 'Testing direct alert' }
      },
      {
        description: 'Test critical error helper',
        body: { testType: 'critical', message: 'Testing critical error' }
      },
      {
        description: 'Test warning error helper',
        body: { testType: 'warning', message: 'Testing warning error' }
      },
      {
        description: 'Test user signup notification (via analytics)',
        body: { testType: 'signup', message: 'Testing signup notification' }
      },
      {
        description: 'Test quiz generation notification (via analytics)',
        body: { testType: 'quiz', message: 'Testing quiz notification' }
      },
      {
        description: 'Test direct user signup notification',
        body: { testType: 'signup-direct', message: 'Testing direct signup' }
      },
      {
        description: 'Test direct quiz generation notification',
        body: { testType: 'quiz-direct', message: 'Testing direct quiz' }
      }
    ],
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasDiscordErrorWebhook: !!process.env.DISCORD_ERROR_WEBHOOK_URL,
      hasDiscordNotificationsWebhook: !!process.env.DISCORD_NOTIFICATIONS_WEBHOOK_URL,
      note: 'Discord alerts only send in production environment by default'
    }
  });
}
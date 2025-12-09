/**
 * Discord Notification Service for Positive Events
 * Sends celebratory notifications for user signups, quiz generations, and other positive events
 */

export interface UserSignupNotification {
  email?: string;
  source: string;
  referrer?: string;
  hasExistingData?: boolean;
  timestamp?: string;
}

export interface QuizGenerationNotification {
  fileType: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  userType: 'anonymous' | 'authenticated';
  fileSize?: number;
  quizTitle?: string;
  timestamp?: string;
}

export interface DiscordNotificationConfig {
  webhookUrl?: string;
  environment: string;
  rateLimitMs: number;
}

// Simple in-memory rate limiting to prevent spam
const recentNotifications = new Map<string, number>();

/**
 * Send user signup notification to Discord
 */
export async function sendUserSignupNotification(
  notification: UserSignupNotification,
  config?: Partial<DiscordNotificationConfig>
): Promise<{ success: boolean; error?: string }> {
  const defaultConfig: DiscordNotificationConfig = {
    webhookUrl: process.env.DISCORD_NOTIFICATIONS_WEBHOOK_URL,
    environment: process.env.NODE_ENV || 'development',
    rateLimitMs: 30000, // 30 seconds rate limiting
  };

  const finalConfig = { ...defaultConfig, ...config };

  // Only send notifications in production unless explicitly overridden
  if (finalConfig.environment !== 'production' && !finalConfig.webhookUrl?.includes('test')) {
    console.log('🔕 Discord signup notifications disabled in non-production environment');
    return { success: true };
  }

  if (!finalConfig.webhookUrl) {
    console.warn('⚠️ DISCORD_NOTIFICATIONS_WEBHOOK_URL not configured - skipping signup notification');
    return { success: false, error: 'Webhook URL not configured' };
  }

  // Rate limiting: prevent spam
  const rateLimitKey = `signup-${notification.email || 'anonymous'}`;
  const lastNotification = recentNotifications.get(rateLimitKey);
  const now = Date.now();

  if (lastNotification && (now - lastNotification) < finalConfig.rateLimitMs) {
    console.log(`🔕 Rate limiting Discord signup notification for ${rateLimitKey}`);
    return { success: true };
  }

  recentNotifications.set(rateLimitKey, now);

  try {
    const embed = createSignupEmbed(notification, finalConfig);
    const payload = { embeds: [embed] };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      console.log('🎉 Sending user signup notification to Discord...');

      const response = await fetch(finalConfig.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ User signup notification sent successfully to Discord');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Discord signup notification webhook failed:', response.status, errorText);
        return { success: false, error: `Discord API error: ${response.status}` };
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('⏰ Discord signup notification webhook timed out');
        return { success: false, error: 'Request timeout' };
      } else {
        console.error('❌ Discord signup notification webhook failed:', fetchError);
        return { success: false, error: fetchError instanceof Error ? fetchError.message : 'Unknown error' };
      }
    }

  } catch (error) {
    console.error('❌ Failed to prepare Discord signup notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send quiz generation notification to Discord
 */
export async function sendQuizGenerationNotification(
  notification: QuizGenerationNotification,
  config?: Partial<DiscordNotificationConfig>
): Promise<{ success: boolean; error?: string }> {
  const defaultConfig: DiscordNotificationConfig = {
    webhookUrl: process.env.DISCORD_NOTIFICATIONS_WEBHOOK_URL,
    environment: process.env.NODE_ENV || 'development',
    rateLimitMs: 10000, // 10 seconds rate limiting
  };

  const finalConfig = { ...defaultConfig, ...config };

  // Only send notifications in production unless explicitly overridden
  if (finalConfig.environment !== 'production' && !finalConfig.webhookUrl?.includes('test')) {
    console.log('🔕 Discord quiz notifications disabled in non-production environment');
    return { success: true };
  }

  if (!finalConfig.webhookUrl) {
    console.warn('⚠️ DISCORD_NOTIFICATIONS_WEBHOOK_URL not configured - skipping quiz notification');
    return { success: false, error: 'Webhook URL not configured' };
  }

  // Rate limiting: prevent spam
  const rateLimitKey = `quiz-${notification.userType}`;
  const lastNotification = recentNotifications.get(rateLimitKey);
  const now = Date.now();

  if (lastNotification && (now - lastNotification) < finalConfig.rateLimitMs) {
    console.log(`🔕 Rate limiting Discord quiz notification for ${rateLimitKey}`);
    return { success: true };
  }

  recentNotifications.set(rateLimitKey, now);

  try {
    const embed = createQuizEmbed(notification, finalConfig);
    const payload = { embeds: [embed] };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      console.log('🧠 Sending quiz generation notification to Discord...');

      const response = await fetch(finalConfig.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Quiz generation notification sent successfully to Discord');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Discord quiz notification webhook failed:', response.status, errorText);
        return { success: false, error: `Discord API error: ${response.status}` };
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('⏰ Discord quiz notification webhook timed out');
        return { success: false, error: 'Request timeout' };
      } else {
        console.error('❌ Discord quiz notification webhook failed:', fetchError);
        return { success: false, error: fetchError instanceof Error ? fetchError.message : 'Unknown error' };
      }
    }

  } catch (error) {
    console.error('❌ Failed to prepare Discord quiz notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create Discord embed for user signup notification
 */
function createSignupEmbed(notification: UserSignupNotification, config: DiscordNotificationConfig) {
  return {
    title: '🎉 New User Signup',
    color: 0x10b981, // Green color
    fields: [
      {
        name: '👤 User Type',
        value: notification.email ? 'Registered User' : 'Anonymous',
        inline: true
      },
      {
        name: '📧 Email',
        value: notification.email ? `||${notification.email}||` : 'Anonymous', // Spoiler tags for privacy
        inline: true
      },
      {
        name: '🌍 Environment',
        value: config.environment,
        inline: true
      },
      {
        name: '📍 Source',
        value: notification.source || 'direct',
        inline: true
      },
      {
        name: '🔗 Referrer',
        value: notification.referrer || 'Direct traffic',
        inline: true
      },
      {
        name: '💾 Has Existing Data',
        value: notification.hasExistingData ? 'Yes' : 'No',
        inline: true
      }
    ],
    footer: {
      text: `${notification.timestamp || new Date().toISOString()} | KwizMe User Growth`
    },
    timestamp: notification.timestamp || new Date().toISOString()
  };
}

/**
 * Create Discord embed for quiz generation notification
 */
function createQuizEmbed(notification: QuizGenerationNotification, config: DiscordNotificationConfig) {
  const fileSizeMB = notification.fileSize ? Math.round(notification.fileSize / (1024 * 1024) * 100) / 100 : undefined;

  return {
    title: '🧠 New Quiz Generated',
    color: 0x3b82f6, // Blue color
    fields: [
      {
        name: '📄 File Type',
        value: notification.fileType || 'Unknown',
        inline: true
      },
      {
        name: '⚡ Difficulty',
        value: notification.difficulty.toUpperCase(),
        inline: true
      },
      {
        name: '❓ Questions',
        value: notification.numQuestions.toString(),
        inline: true
      },
      {
        name: '👤 User Type',
        value: notification.userType === 'authenticated' ? '🔐 Authenticated' : '👤 Anonymous',
        inline: true
      },
      {
        name: '📁 File Size',
        value: fileSizeMB ? `${fileSizeMB} MB` : 'Unknown',
        inline: true
      },
      {
        name: '🌍 Environment',
        value: config.environment,
        inline: true
      },
      ...(notification.quizTitle ? [{
        name: '📚 Quiz Title',
        value: notification.quizTitle,
        inline: false
      }] : [])
    ],
    footer: {
      text: `${notification.timestamp || new Date().toISOString()} | KwizMe Usage Analytics`
    },
    timestamp: notification.timestamp || new Date().toISOString()
  };
}

/**
 * Clear rate limit cache (useful for testing)
 */
export function clearNotificationRateLimit() {
  recentNotifications.clear();
}
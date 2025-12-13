/**
 * Discord Error Alert Service
 * Sends critical application errors to Discord for immediate notification
 */

/**
 * Format timestamp in Singapore timezone to match Discord specification
 */
function formatSingaporeTime(timestamp?: string): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export interface ErrorAlert {
  errorType: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  errorCode?: string;
  userId?: string;
  sessionId?: string;
  context?: string;
  stack?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
}

export interface DiscordAlertConfig {
  webhookUrl?: string;
  rateLimitMs: number;
  maxStackLines: number;
}

// Simple in-memory rate limiting to prevent spam
const recentAlerts = new Map<string, number>();

/**
 * Send error alert to Discord
 * @param alert Error alert details
 * @param config Configuration options
 */
export async function sendDiscordErrorAlert(
  alert: ErrorAlert,
  config?: Partial<DiscordAlertConfig>
): Promise<{ success: boolean; error?: string }> {
  const defaultConfig: DiscordAlertConfig = {
    webhookUrl: process.env.DISCORD_ERROR_WEBHOOK_URL,
    rateLimitMs: 60000, // 1 minute rate limiting per error type
    maxStackLines: 10,
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.webhookUrl) {
    console.warn('⚠️ DISCORD_ERROR_WEBHOOK_URL not configured - skipping error alert');
    return { success: false, error: 'Webhook URL not configured' };
  }

  // Rate limiting: prevent spam of same error type
  const rateLimitKey = `${alert.errorType}-${alert.errorCode || alert.title}`;
  const lastAlert = recentAlerts.get(rateLimitKey);
  const now = Date.now();

  if (lastAlert && (now - lastAlert) < finalConfig.rateLimitMs) {
    console.log(`🔕 Rate limiting Discord alert for ${rateLimitKey}`);
    return { success: true }; // Don't treat rate limiting as failure
  }

  recentAlerts.set(rateLimitKey, now);

  try {
    const embed = createErrorEmbed(alert, finalConfig);
    const payload = { embeds: [embed] };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      console.log(`🚨 Sending ${alert.errorType} error alert to Discord...`);

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
        console.log('✅ Error alert sent successfully to Discord');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Discord error alert webhook failed:', response.status, errorText);
        return { success: false, error: `Discord API error: ${response.status}` };
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('⏰ Discord error alert webhook timed out');
        return { success: false, error: 'Request timeout' };
      } else {
        console.error('❌ Discord error alert webhook failed:', fetchError);
        return { success: false, error: fetchError instanceof Error ? fetchError.message : 'Unknown error' };
      }
    }

  } catch (error) {
    console.error('❌ Failed to prepare Discord error alert:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create Discord embed for error alert
 */
function createErrorEmbed(alert: ErrorAlert, config: DiscordAlertConfig) {
  // Color coding by severity
  const embedColor = alert.errorType === 'critical' ? 0xFF0000 : // Red for critical
                    alert.errorType === 'warning' ? 0xFFA500 :  // Orange for warning
                    0x0099FF; // Blue for info

  // Emoji for severity
  const severityEmoji = alert.errorType === 'critical' ? '🔴' :
                       alert.errorType === 'warning' ? '🟡' :
                       '🔵';

  const fields = [];

  // Basic error information
  fields.push({
    name: '🚨 Severity',
    value: `${severityEmoji} ${alert.errorType.toUpperCase()}`,
    inline: true
  });

  if (alert.errorCode) {
    fields.push({
      name: '🏷️ Error Code',
      value: `\`${alert.errorCode}\``,
      inline: true
    });
  }


  // User context if available
  if (alert.userId || alert.sessionId) {
    fields.push({
      name: '👤 User Context',
      value: [
        alert.userId ? `User: \`${alert.userId}\`` : null,
        alert.sessionId ? `Session: \`${alert.sessionId}\`` : null
      ].filter(Boolean).join('\n'),
      inline: false
    });
  }

  // Request context if available
  if (alert.url || alert.userAgent) {
    fields.push({
      name: '🔗 Request Context',
      value: [
        alert.url ? `URL: ${alert.url}` : null,
        alert.userAgent ? `User Agent: \`${alert.userAgent.substring(0, 100)}${alert.userAgent.length > 100 ? '...' : ''}\`` : null
      ].filter(Boolean).join('\n'),
      inline: false
    });
  }

  // Error message
  fields.push({
    name: '💥 Error Message',
    value: `\`\`\`\n${alert.message.substring(0, 1000)}${alert.message.length > 1000 ? '\n...' : ''}\n\`\`\``,
    inline: false
  });

  // Context if provided
  if (alert.context) {
    fields.push({
      name: '📝 Context',
      value: alert.context.substring(0, 500) + (alert.context.length > 500 ? '...' : ''),
      inline: false
    });
  }

  // Stack trace (truncated)
  if (alert.stack) {
    const stackLines = alert.stack.split('\n');
    const truncatedStack = stackLines.slice(0, config.maxStackLines).join('\n');
    const hasMore = stackLines.length > config.maxStackLines;

    fields.push({
      name: '🔍 Stack Trace',
      value: `\`\`\`\n${truncatedStack}${hasMore ? '\n... (truncated)' : ''}\n\`\`\``,
      inline: false
    });
  }

  return {
    title: `🚨 KwizMe Error Alert: ${alert.title}`,
    color: embedColor,
    fields,
    footer: {
      text: `${formatSingaporeTime(alert.timestamp)} | KwizMe Error Monitoring`
    },
    timestamp: alert.timestamp || new Date().toISOString()
  };
}

/**
 * Quick helper for sending critical errors
 */
export async function sendCriticalError(
  title: string,
  error: Error | string,
  context?: Partial<ErrorAlert>
): Promise<{ success: boolean; error?: string }> {
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  return sendDiscordErrorAlert({
    errorType: 'critical',
    title,
    message: errorMessage,
    stack,
    timestamp: new Date().toISOString(),
    ...context
  });
}

/**
 * Quick helper for sending warning errors
 */
export async function sendWarningError(
  title: string,
  message: string,
  context?: Partial<ErrorAlert>
): Promise<{ success: boolean; error?: string }> {
  return sendDiscordErrorAlert({
    errorType: 'warning',
    title,
    message,
    timestamp: new Date().toISOString(),
    ...context
  });
}

/**
 * Clear rate limit cache (useful for testing)
 */
export function clearRateLimit() {
  recentAlerts.clear();
}
import { NextRequest, NextResponse } from 'next/server';

// Set runtime timeout to prevent hanging requests
export const maxDuration = 30; // 30 seconds max

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      errorType,
      title,
      message,
      errorCode,
      userId,
      sessionId,
      context,
      stack,
      userAgent,
      url
    } = body;

    console.log('🚨 Processing error alert notification:', {
      errorType,
      title,
      errorCode,
      hasUserId: !!userId,
      context
    });

    // Determine severity and color
    const alertType = errorType || 'critical';
    const embedColor = alertType === 'critical' ? 0xFF0000 : // Red for critical
                      alertType === 'warning' ? 0xFFA500 :  // Orange for warning
                      0x0099FF; // Blue for info

    const severityEmoji = alertType === 'critical' ? '🔥' :
                         alertType === 'warning' ? '⚠️' :
                         'ℹ️';

    // Prepare Discord webhook payload with rich embed (copying feedback pattern)
    const fields = [];

    // Basic error information
    fields.push({
      name: `${severityEmoji} Severity`,
      value: alertType.toUpperCase(),
      inline: true
    });

    if (errorCode) {
      fields.push({
        name: '🏷️ Error Code',
        value: `\`${errorCode}\``,
        inline: true
      });
    }

    // User context if available
    if (userId || sessionId) {
      fields.push({
        name: '👤 User Context',
        value: [
          userId ? `User: \`${userId}\`` : null,
          sessionId ? `Session: \`${sessionId}\`` : null
        ].filter(Boolean).join('\n'),
        inline: true
      });
    }

    // Request context if available
    if (url || userAgent) {
      const contextValue = [
        url ? `URL: ${url}` : null,
        userAgent ? `User Agent: \`${userAgent.substring(0, 100)}${userAgent.length > 100 ? '...' : ''}\`` : null
      ].filter(Boolean).join('\n');

      fields.push({
        name: '🔗 Request Context',
        value: contextValue.substring(0, 1024), // Discord limit: 1024 chars per field
        inline: true
      });
    }

    // Error message
    const errorMessageValue = `\`\`\`\n${(message || '').substring(0, 950)}${message && message.length > 950 ? '\n...' : ''}\n\`\`\``;
    fields.push({
      name: '💥 Error Message',
      value: errorMessageValue.substring(0, 1024), // Discord limit: 1024 chars per field
      inline: false
    });

    // Context if provided
    if (context) {
      fields.push({
        name: '📝 Context',
        value: (context || '').substring(0, 1024), // Discord limit: 1024 chars per field
        inline: true
      });
    }

    // Stack trace (truncated)
    if (stack) {
      const stackLines = (stack || '').split('\n');
      let truncatedStack = stackLines.slice(0, 8).join('\n'); // Fewer lines to stay under limit

      // Ensure we stay under Discord's 1024 character limit for field values
      if (truncatedStack.length > 950) {
        truncatedStack = truncatedStack.substring(0, 950);
      }

      const stackValue = `\`\`\`\n${truncatedStack}\n... (truncated for Discord limits)\n\`\`\``;

      fields.push({
        name: '🔍 Stack Trace',
        value: stackValue.substring(0, 1024), // Discord limit: 1024 chars per field
        inline: false
      });
    }

    const discordPayload = {
      embeds: [{
        title: `🚨 KwizMe Error Alert: ${(title || 'Unknown Error').substring(0, 200)}`, // Conservative title limit
        color: embedColor,
        fields: fields.slice(0, 25), // Discord limit: max 25 fields per embed
        footer: {
          text: `${formatSingaporeTime()} | KwizMe Error Monitoring`.substring(0, 2048) // Discord footer limit
        }
      }]
    };

    // Debug: Log payload size and field info
    const payloadSize = JSON.stringify(discordPayload).length;
    console.log('📊 Discord payload stats:', {
      totalSize: payloadSize,
      fieldsCount: fields.length,
      titleLength: (title || '').length
    });

    // Add timeout to the Discord webhook request (copying feedback pattern)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      console.log('🔄 Sending error alert to Discord...');

      if (!process.env.DISCORD_ERROR_WEBHOOK_URL) {
        throw new Error('DISCORD_ERROR_WEBHOOK_URL not configured');
      }

      const response = await fetch(process.env.DISCORD_ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordPayload),
        signal: controller.signal,
      });

      console.log('✅ Discord webhook request completed with status:', response.status);

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Error alert sent successfully to Discord');
        return NextResponse.json({
          success: true,
          message: 'Error alert sent to Discord successfully.'
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Discord webhook error:', response.status, errorText);
        console.error('❌ Failed payload fields count:', fields.length);
        console.error('❌ Failed payload title length:', (title || '').length);

        return NextResponse.json({
          success: false,
          message: 'Discord webhook failed',
          error: `Discord API error: ${response.status}`,
          details: errorText
        }, { status: 500 });
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('⏰ Discord webhook request timed out');
      } else {
        console.error('❌ Discord webhook failed:', fetchError);
      }

      return NextResponse.json({
        success: false,
        message: 'Discord webhook failed',
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error alert notification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sorry, we encountered an error processing the error alert notification.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';

// Set runtime timeout to prevent hanging requests
export const maxDuration = 30; // 30 seconds max

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileType, difficulty, numQuestions, userType, fileSize, quizTitle, userEmail } = body;

    console.log('🧠 Processing quiz generation notification:', {
      fileType,
      difficulty,
      numQuestions,
      userType,
      hasTitle: !!quizTitle,
      hasUserEmail: !!userEmail
    });

    // Prepare Discord webhook payload with rich embed (copying feedback pattern)
    const fileSizeMB = fileSize ? Math.round(fileSize / (1024 * 1024) * 100) / 100 : undefined;

    const fields = [
      {
        name: '📄 File Type',
        value: fileType || 'Unknown',
        inline: true
      },
      {
        name: '⚡ Difficulty',
        value: difficulty ? difficulty.toUpperCase() : 'Unknown',
        inline: true
      },
      {
        name: '❓ Questions',
        value: numQuestions ? numQuestions.toString() : 'Unknown',
        inline: true
      },
      {
        name: '👤 User Type',
        value: userType === 'authenticated' ? 'Authenticated' : 'Anonymous',
        inline: true
      },
      {
        name: '📁 File Size',
        value: fileSizeMB ? `${fileSizeMB} MB` : 'Unknown',
        inline: true
      }
    ];

    // Add email field if available (for authenticated users)
    if (userEmail) {
      fields.push({
        name: '📧 User Email',
        value: `||${userEmail}||`, // Spoiler tags for privacy
        inline: true
      });
    }

    // Add quiz title if available
    if (quizTitle) {
      fields.push({
        name: '📚 Quiz Title',
        value: quizTitle,
        inline: false
      });
    }

    const discordPayload = {
      embeds: [{
        title: `🧠 New KwizMe Quiz Generated`,
        color: 0x3b82f6, // Blue color
        fields,
        footer: {
          text: `${new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' })} | KwizMe Usage Analytics`
        }
      }]
    };

    // Add timeout to the Discord webhook request (copying feedback pattern)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      console.log('🔄 Sending quiz notification to Discord...');

      if (!process.env.DISCORD_NOTIFICATIONS_WEBHOOK_URL) {
        throw new Error('DISCORD_NOTIFICATIONS_WEBHOOK_URL not configured');
      }

      const response = await fetch(process.env.DISCORD_NOTIFICATIONS_WEBHOOK_URL, {
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
        console.log('✅ Quiz notification sent successfully to Discord');
        return NextResponse.json({
          success: true,
          message: 'Quiz notification sent to Discord successfully.'
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Discord webhook error:', response.status, errorText);

        return NextResponse.json({
          success: false,
          message: 'Discord webhook failed',
          error: `Discord API error: ${response.status}`
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
    console.error('❌ Quiz notification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sorry, we encountered an error processing the quiz notification.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
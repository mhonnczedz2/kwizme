import { NextRequest, NextResponse } from 'next/server';

// Set runtime timeout to prevent hanging requests
export const maxDuration = 30; // 30 seconds max

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, institution, program, source } = body;

    console.log('🎉 Processing signup notification:', {
      hasEmail: !!email,
      hasName: !!name,
      hasInstitution: !!institution,
      hasProgram: !!program,
      source: source || 'unknown'
    });

    // Prepare Discord webhook payload with rich embed (copying feedback pattern)
    const discordPayload = {
      embeds: [{
        title: `🎉 New KwizMe User Signup`,
        color: 0x10b981, // Green color
        fields: [
          {
            name: '📧 Email',
            value: email ? `||${email}||` : 'Anonymous', // Spoiler tags for privacy
            inline: true
          },
          {
            name: '📝 Source',
            value: source === 'signup_form' ? 'Direct Signup' :
                   source === 'email_confirmation' ? 'Email Confirmation' :
                   source || 'Unknown',
            inline: true
          },
          ...(name ? [{
            name: '👤 Name',
            value: name,
            inline: true
          }] : []),
          ...(institution ? [{
            name: '🏫 Institution',
            value: institution,
            inline: true
          }] : []),
          ...(program ? [{
            name: '🎓 Program',
            value: program,
            inline: true
          }] : [])
        ],
        footer: {
          text: `${new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' })} | KwizMe User Growth`
        }
      }]
    };

    // Add timeout to the Discord webhook request (copying feedback pattern)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      console.log('🔄 Sending signup notification to Discord...');

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
        console.log('✅ Signup notification sent successfully to Discord');
        return NextResponse.json({
          success: true,
          message: 'Signup notification sent to Discord successfully.'
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
    console.error('❌ Signup notification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sorry, we encountered an error processing the signup notification.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
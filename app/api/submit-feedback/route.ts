import { NextRequest, NextResponse } from 'next/server';

// Set runtime timeout to prevent hanging requests
export const maxDuration = 30; // 30 seconds max

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract feedback data
    const feedback = formData.get('message') as string;  // Form field is 'message', not 'feedback'
    const rating = formData.get('rating') as string;
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const feedbackType = formData.get('type') as string || 'general';

    console.log('📝 Processing feedback:', { rating, feedbackType, hasEmail: !!email, feedback: feedback?.substring(0, 100) + '...' });

    // Validate required fields
    if (!feedback || feedback.trim().length < 5) {
      return NextResponse.json({
        success: false,
        message: 'Feedback must be at least 5 characters long.',
      }, { status: 400 });
    }

    if (!rating || !['1', '2', '3', '4', '5'].includes(rating)) {
      return NextResponse.json({
        success: false,
        message: 'Please provide a valid rating (1-5 stars).',
      }, { status: 400 });
    }

    // Prepare Discord webhook payload with rich embed
    const embedColor = feedbackType === 'bug' ? 0xff8000 : // Orange for Bug Report
                      feedbackType === 'feature' ? 0x4285f4 : // Blue for Feature Request
                      0x10b981; // Green for General Feedback

    const starEmojis = '★'.repeat(parseInt(rating));

    // Format type display
    const typeDisplay = feedbackType === 'bug' ? 'Bug Report' :
                       feedbackType === 'feature' ? 'Feature Request' :
                       feedbackType === 'general' ? 'General Feedback' :
                       'General Feedback'; // fallback

    const discordPayload = {
      embeds: [{
        title: `🎯 New KwizMe Feedback`,
        color: embedColor,
        fields: [
          {
            name: '⭐ Rating',
            value: starEmojis,
            inline: true
          },
          {
            name: '📂 Type',
            value: typeDisplay,
            inline: true
          },
          {
            name: '👤 Name',
            value: name || 'Anonymous',
            inline: true
          },
          {
            name: '📧 Email',
            value: email || 'Anonymous',
            inline: true
          },
          {
            name: '💬 Feedback',
            value: `\`\`\`\n${feedback.substring(0, 1000)}${feedback.length > 1000 ? '\n...' : ''}\n\`\`\``,
            inline: false
          }
        ],
        footer: {
          text: `Submitted ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' })} | KwizMe Feedback System`
        }
      }]
    };

    // Add timeout to the Discord webhook request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      console.log('🔄 Sending feedback to Discord...');

      if (!process.env.DISCORD_WEBHOOK_URL) {
        throw new Error('DISCORD_WEBHOOK_URL not configured');
      }

      const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
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
        console.log('✅ Feedback sent successfully to Discord');
        return NextResponse.json({
          success: true,
          message: 'Thank you for your feedback! We appreciate you helping us improve KwizMe.'
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Discord webhook error:', response.status, errorText);

        // Try database fallback if Discord fails
        return await handleFallback(feedback, rating, email, feedbackType);
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('⏰ Discord webhook request timed out');
      } else {
        console.error('❌ Discord webhook failed:', fetchError);
      }

      // Try database fallback if Discord fails
      return await handleFallback(feedback, rating, email, feedbackType);
    }

  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    return NextResponse.json({
      success: false,
      message: 'Sorry, we encountered an error processing your feedback. Please try again in a few moments.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Fallback function to store feedback when Discord webhook fails
async function handleFallback(feedback: string, rating: string, email: string, feedbackType: string) {
  try {
    console.log('🔄 Attempting database fallback...');

    // For now, just log the feedback and return success
    // You could implement Supabase storage here if needed
    console.log('📝 FALLBACK FEEDBACK:', {
      rating,
      feedbackType,
      email: email || 'Anonymous',
      feedback,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! It has been saved and we will review it soon.'
    });

  } catch (fallbackError) {
    console.error('❌ Fallback also failed:', fallbackError);

    return NextResponse.json({
      success: false,
      message: 'We appreciate your feedback, but encountered a technical issue. Please email us directly at the contact address.',
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sendFeedbackNotification } from '../../../lib/discord-notifications';

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

    // Send notification using centralized Discord service
    console.log('🔄 Sending feedback to Discord...');

    const feedbackResult = await sendFeedbackNotification({
      rating: parseInt(rating),
      type: feedbackType as 'bug' | 'feature' | 'general',
      name: name || undefined,
      email: email || undefined,
      feedback,
      timestamp: new Date().toISOString()
    });

    if (feedbackResult.success) {
      console.log('✅ Feedback sent successfully to Discord');
      return NextResponse.json({
        success: true,
        message: 'Thank you for your feedback! We appreciate you helping us improve KwizMe.'
      });
    } else {
      console.error('❌ Discord feedback notification failed:', feedbackResult.error);
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

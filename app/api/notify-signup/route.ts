import { NextRequest, NextResponse } from 'next/server';
import { sendUserSignupNotification } from '../../../lib/discord-notifications';

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

    // Send notification using centralized Discord service
    console.log('🔄 Sending signup notification to Discord...');

    const signupResult = await sendUserSignupNotification({
      email: email || undefined,
      source: source || 'unknown', // Keep source for logging but don't include in Discord
      name: name || undefined,
      institution: institution || undefined,
      program: program || undefined,
      timestamp: new Date().toISOString()
    });

    if (signupResult.success) {
      console.log('✅ Signup notification sent successfully to Discord');
      return NextResponse.json({
        success: true,
        message: 'Signup notification sent to Discord successfully.'
      });
    } else {
      console.error('❌ Discord signup notification failed:', signupResult.error);
      return NextResponse.json({
        success: false,
        message: 'Discord notification failed',
        error: signupResult.error
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
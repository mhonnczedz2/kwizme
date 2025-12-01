import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get the site URL from environment or request origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';

    console.log('📧 Sending feedback from:', siteUrl);

    // Forward to FormSubmit with proper headers
    const response = await fetch('https://formsubmit.co/my.stationptot@gmail.com', {
      method: 'POST',
      body: formData,
      headers: {
        'Origin': siteUrl,
        'Referer': siteUrl,
      },
    });

    if (response.ok) {
      console.log('✅ Feedback sent successfully');
      return NextResponse.json({ success: true, message: 'Feedback sent successfully' });
    } else {
      const errorText = await response.text();
      console.error('❌ FormSubmit error:', errorText);
      return NextResponse.json({
        success: false,
        message: 'Failed to send feedback',
        error: errorText
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

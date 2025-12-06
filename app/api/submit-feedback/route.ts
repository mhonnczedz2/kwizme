import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Dynamically get the site URL from the request headers
    const getSiteUrl = () => {
      // First try the environment variable (for production deployments)
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
      }

      // For development/dynamic environments, construct from request headers
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') ||
                      (host?.includes('localhost') || host?.includes('127.0.0.1') ? 'http' : 'https');

      if (host) {
        return `${protocol}://${host}`;
      }

      // Final fallback (should rarely be used)
      return request.headers.get('origin') || 'http://localhost:3000';
    };

    const siteUrl = getSiteUrl();
    console.log('📧 Sending feedback from:', siteUrl);

    // Log form data for debugging
    const formEntries = Array.from(formData.entries());
    console.log('📝 Form data:', formEntries.map(([key, value]) => `${key}: ${value}`));

    // Forward to FormSubmit with proper headers
    const response = await fetch('https://formsubmit.co/my.stationptot@gmail.com', {
      method: 'POST',
      body: formData,
      headers: {
        'Origin': siteUrl,
        'Referer': siteUrl,
      },
    });

    console.log('🔄 FormSubmit response status:', response.status);
    console.log('🔄 FormSubmit response headers:', Object.fromEntries(response.headers.entries()));

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

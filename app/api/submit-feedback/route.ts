import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Forward to FormSubmit
    const response = await fetch('https://formsubmit.co/my.stationptot@gmail.com', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Feedback sent successfully' });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to send feedback' }, { status: 500 });
    }
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

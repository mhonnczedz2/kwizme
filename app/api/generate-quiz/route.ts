import { NextRequest, NextResponse } from 'next/server';
import { generateQuizWithGemini, validateQuizResponse, validateAndImproveDescription } from '@/lib/llm-client';
import { checkQuizGenerationLimit, recordQuizGeneration } from '@/lib/rate-limiting';
import { createClient } from '@/lib/supabase/server';
import { trackQuizGenerated, trackRateLimitHit, trackError } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    // Step 1: Check rate limiting first (before processing file)
    console.log('🔒 Checking quiz generation limits...');

    // Get user ID from session if available
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Get client IP address for rate limiting anonymous users
    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'

    // Check if user can generate another quiz today
    const rateLimitResult = await checkQuizGenerationLimit(userId, clientIP);

    if (!rateLimitResult.allowed) {
      // Track rate limit hit event
      trackRateLimitHit({
        currentCount: rateLimitResult.limits.currentUsage || 0,
        dailyLimit: rateLimitResult.limits.dailyLimit || 5,
        userType: userId ? 'authenticated' : 'anonymous',
        planType: rateLimitResult.limits.isUnlimited ? 'unlimited' : 'free'
      });

      return NextResponse.json({
        error: 'Daily quiz generation limit reached',
        message: rateLimitResult.reason || `You've reached your ${rateLimitResult.limits.dailyLimit}-quiz generation daily limit! Limits reset at 12:00 AM daily.`,
        limits: rateLimitResult.limits,
        resetTime: rateLimitResult.resetTime
      }, { status: 429 }); // 429 Too Many Requests
    }

    console.log(`✅ Rate limit check passed. Remaining: ${rateLimitResult.limits.remainingQuizzes === -1 ? 'unlimited' : rateLimitResult.limits.remainingQuizzes}`);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('pdf_file') as File;
    const numQuestions = parseInt(formData.get('num_questions') as string) || 15;
    const difficulty = (formData.get('difficulty') as string) || 'medium';

    // Validate number of questions
    if (numQuestions < 10 || numQuestions > 50) {
      return NextResponse.json(
        { error: 'Number of questions must be between 10 and 50' },
        { status: 400 }
      );
    }

    // Extract organization metadata (optional fields)
    const quiz_title = formData.get('quiz_title') as string | null;
    const file_description = formData.get('file_description') as string | null;
    const institution = formData.get('institution') as string | null;
    const program = formData.get('program') as string | null;
    const course = formData.get('course') as string | null;
    const course_code = formData.get('course_code') as string | null;
    const topic = formData.get('topic') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Supported file types for Gemini 2.5 Flash
    const supportedTypes = [
      'application/pdf',                                                          // PDF
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // XLSX
      'text/plain',                                                               // TXT
      'text/markdown',                                                            // MD
      'text/html',                                                                // HTML
      'text/csv',                                                                 // CSV
      'image/png',                                                                // PNG
      'image/jpeg',                                                               // JPEG/JPG
      'image/webp',                                                               // WebP
      'image/gif',                                                                // GIF
    ];

    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Unsupported file type. Supported formats: PDF, Word (DOCX), PowerPoint (PPTX), Excel (XLSX), Images (PNG, JPEG, WebP, GIF), Text (TXT, MD, HTML, CSV)'
        },
        { status: 400 }
      );
    }

    // Increased size limit to 20MB to accommodate presentations and images
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 20MB' },
        { status: 400 }
      );
    }

    console.log('📄 Processing file:', file.name, `(${file.type})`);

    // Step 1: Validate and improve description using Gemini's native file support
    console.log('📝 Validating and enhancing description...');
    const enhancedDescription = await validateAndImproveDescription(file, file_description);

    // Step 2: Generate quiz using Gemini with direct file upload
    console.log('🤖 Generating quiz with Gemini Flash...');
    const quizData = await generateQuizWithGemini(file, numQuestions, difficulty, enhancedDescription);

    // Step 3: Validate response
    if (!validateQuizResponse(quizData)) {
      console.error('❌ Quiz validation failed');
      return NextResponse.json(
        { error: 'Generated quiz failed validation. Please try again.' },
        { status: 500 }
      );
    }

    // Add quiz metadata to response
    quizData.quiz_title = quiz_title || file.name.replace('.pdf', '');
    quizData.file_name = file.name;
    quizData.description = enhancedDescription; // Store the enhanced description
    quizData.institution = institution || '';
    quizData.program = program || '';
    quizData.course = course || '';
    quizData.course_code = course_code || '';
    quizData.topic = topic || '';

    console.log('✅ Quiz generated successfully:', quizData.questions.length, 'questions');

    // Step 4: Record quiz generation (increment usage counter)
    console.log('📊 Recording quiz generation...');
    try {
      await recordQuizGeneration(userId, clientIP);
      console.log('✅ Quiz usage recorded successfully');
    } catch (error) {
      console.error('⚠️ Failed to record quiz usage:', error);
      // Don't fail the request if usage recording fails
    }

    // Track successful quiz generation
    trackQuizGenerated({
      fileType: file.type,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      numQuestions: numQuestions, // Already parsed as number
      userType: userId ? 'authenticated' : 'anonymous',
      fileSize: file.size
    });

    // Return quiz data
    return NextResponse.json(quizData);

  } catch (error: any) {
    console.error('❌ Quiz generation error:', error);

    // Track error event
    trackError({
      errorType: 'api_error',
      errorMessage: error.message || 'Unknown quiz generation error',
      context: 'quiz_generation',
      error: error // Pass the actual error object for Sentry
    });

    // Handle specific error types
    if (error.message?.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'API key not configured. Please add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    if (error.message?.includes('Gemini API error')) {
      return NextResponse.json(
        { error: 'Failed to connect to AI service. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

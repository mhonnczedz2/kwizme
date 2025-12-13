import { NextRequest, NextResponse } from 'next/server';
import { generateQuizWithGemini, validateQuizResponse, validateAndImproveDescription } from '@/lib/llm-client';
import { checkQuizGenerationLimit, recordQuizGeneration } from '@/lib/rate-limiting';
import { createClient } from '@/lib/supabase/server';
import { trackQuizGenerated, trackRateLimitHit, trackError } from '@/lib/analytics';

// Error codes for easy reporting
type ErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_QUESTION_COUNT'
  | 'NO_FILE_PROVIDED'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'QUIZ_VALIDATION_FAILED'
  | 'AI_SERVICE_ERROR'
  | 'API_KEY_ERROR'
  | 'UNKNOWN_ERROR';

interface ErrorResponse {
  error: string;
  code: ErrorCode;
  reference: string;
  timestamp: string;
  details?: string;
  suggestion?: string;
}

function generateErrorReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KWZ-${timestamp}-${random}`;
}

function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: string,
  suggestion?: string,
  extraFields?: Record<string, any>
): ErrorResponse {
  return {
    error: message,
    code,
    reference: generateErrorReference(),
    timestamp: new Date().toISOString(),
    details,
    suggestion,
    ...extraFields
  };
}

export async function POST(request: NextRequest) {
  // Get user ID from session if available (declare at function level for scope access)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  try {
    // Step 1: Check rate limiting first (before processing file)
    console.log('🔒 Checking quiz generation limits...');

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

      return NextResponse.json(
        createErrorResponse(
          'RATE_LIMIT_EXCEEDED',
          'Daily quiz generation limit reached',
          rateLimitResult.reason || `You've used ${rateLimitResult.limits.currentUsage} of ${rateLimitResult.limits.dailyLimit} quizzes today.`,
          'Wait until the limit resets or contact us!',
          { limits: rateLimitResult.limits, resetTime: rateLimitResult.resetTime }
        ),
        { status: 429 }
      );
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
        createErrorResponse(
          'INVALID_QUESTION_COUNT',
          'Invalid number of questions',
          `You requested ${numQuestions} questions, but the allowed range is 10-50.`,
          'Please select between 10 and 50 questions.'
        ),
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
        createErrorResponse(
          'NO_FILE_PROVIDED',
          'No file provided',
          'The request did not include a file to generate a quiz from.',
          'Please upload a PDF, Word document, PowerPoint, or image file.'
        ),
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
        createErrorResponse(
          'UNSUPPORTED_FILE_TYPE',
          'Unsupported file type',
          `The file type "${file.type || 'unknown'}" is not supported.`,
          'Please upload a PDF, Word (DOCX), PowerPoint (PPTX), Excel (XLSX), Image (PNG, JPEG, WebP, GIF), or Text file (TXT, MD, HTML, CSV).'
        ),
        { status: 400 }
      );
    }

    // Increased size limit to 20MB to accommodate presentations and images
    if (file.size > 20 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        createErrorResponse(
          'FILE_TOO_LARGE',
          'File size too large',
          `Your file is ${fileSizeMB}MB, but the maximum allowed size is 20MB.`,
          'Please upload a smaller file or compress your document.'
        ),
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

    // Step 3: Validate response (check if AI generated sufficient questions)
    if (!validateQuizResponse(quizData, numQuestions)) {
      console.error('❌ Quiz validation failed');
      return NextResponse.json(
        createErrorResponse(
          'QUIZ_VALIDATION_FAILED',
          'Quiz generation failed',
          'The AI generated a quiz but it failed our quality checks. This can happen with complex or unusual content.',
          'Please try again. If the problem persists, try with a different file or simpler content.'
        ),
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

    // Track successful quiz generation (analytics only)
    trackQuizGenerated({
      fileType: file.type,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      numQuestions: numQuestions,
      userType: userId ? 'authenticated' : 'anonymous',
      fileSize: file.size
      // Note: Discord notification handled separately via API
    });

    // Send Discord notification via API route (copying feedback/signup pattern)
    try {
      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notify-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileType: file.type,
          difficulty: difficulty,
          numQuestions: numQuestions,
          userType: userId ? 'authenticated' : 'anonymous',
          fileSize: file.size,
          quizTitle: quizData.quiz_title
        })
      })

      if (notificationResponse.ok) {
        console.log('✅ Quiz notification API call successful')
      } else {
        console.warn('⚠️ Quiz notification API call failed:', notificationResponse.status)
      }
    } catch (apiError) {
      console.warn('⚠️ Failed to call quiz notification API:', apiError)
    }

    // Return quiz data
    return NextResponse.json(quizData);

  } catch (error: any) {
    console.error('❌ Quiz generation error:', error);

    // Track error event (analytics only - Discord handled separately)
    trackError({
      errorType: 'api_error',
      errorMessage: error.message || 'Unknown quiz generation error',
      context: 'quiz_generation',
      error: error // Pass the actual error object for Sentry
    });

    // Send Discord error alert via API route (copying feedback pattern)
    try {
      const errorAlertResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notify-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorType: 'critical',
          title: 'Quiz Generation Failed',
          message: error.message || 'Unknown quiz generation error',
          errorCode: 'QUIZ_GEN_ERROR',
          context: 'quiz_generation',
          stack: error.stack,
          userId: userId || undefined,
          url: '/api/generate-quiz'
        })
      })

      if (errorAlertResponse.ok) {
        console.log('✅ Error alert API call successful')
      } else {
        console.warn('⚠️ Error alert API call failed:', errorAlertResponse.status)
      }
    } catch (apiError) {
      console.warn('⚠️ Failed to call error alert API:', apiError)
    }

    // Handle specific error types
    if (error.message?.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        createErrorResponse(
          'API_KEY_ERROR',
          'Service configuration error',
          'The AI service is not properly configured.',
          'Please contact support if this issue persists.'
        ),
        { status: 500 }
      );
    }

    if (error.message?.includes('Gemini API error') || error.message?.includes('fetch failed')) {
      return NextResponse.json(
        createErrorResponse(
          'AI_SERVICE_ERROR',
          'AI service temporarily unavailable',
          error.message || 'Failed to connect to the AI service.',
          'Please wait a moment and try again.'
        ),
        { status: 503 }
      );
    }

    return NextResponse.json(
      createErrorResponse(
        'UNKNOWN_ERROR',
        'Something went wrong',
        error.message || 'An unexpected error occurred while generating your quiz.',
        'Please try again. If the problem persists, report this error with the reference code below.'
      ),
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/pdf-parser';
import { generateQuizWithGemini, validateQuizResponse } from '@/lib/llm-client';

export async function POST(request: NextRequest) {
  try {
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
    const institution = formData.get('institution') as string | null;
    const program = formData.get('program') as string | null;
    const course = formData.get('course') as string | null;
    const course_code = formData.get('course_code') as string | null;
    const topic = formData.get('topic') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    console.log('📄 Processing PDF:', file.name);

    // Step 1: Extract text from PDF
    const pdfText = await extractTextFromPDF(file);
    console.log('✅ Extracted text length:', pdfText.length, 'characters');

    if (pdfText.length < 100) {
      return NextResponse.json(
        { error: 'PDF contains insufficient text for quiz generation' },
        { status: 400 }
      );
    }

    // Step 2: Generate quiz using LLM
    console.log('🤖 Generating quiz with Gemini Flash...');
    const quizData = await generateQuizWithGemini(pdfText, numQuestions, difficulty);

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
    quizData.institution = institution || undefined;
    quizData.program = program || undefined;
    quizData.course = course || undefined;
    quizData.course_code = course_code || undefined;
    quizData.topic = topic || undefined;

    console.log('✅ Quiz generated successfully:', quizData.questions.length, 'questions');

    // Return quiz data
    return NextResponse.json(quizData);

  } catch (error: any) {
    console.error('❌ Quiz generation error:', error);

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

    if (error.message?.includes('Failed to extract text')) {
      return NextResponse.json(
        { error: 'Could not read PDF file. Please try a different file.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

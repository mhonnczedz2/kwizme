import { QuizGenerationResponse } from '@/lib/db/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Build the prompt for quiz generation
 */
function buildPrompt(pdfText: string, numQuestions: number, difficulty: string): string {
  const difficultyInstructions = {
    easy: 'Focus on recall and basic comprehension: simple definitions, key facts, direct information from the text.',
    medium: 'Focus on application and analysis: conceptual understanding, relationships between ideas, inference from context.',
    hard: 'Focus on synthesis and evaluation: compare and contrast concepts, analyze complex scenarios, apply knowledge to novel situations.'
  };

  const instruction = difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.medium;

  return `You are an expert educator creating multiple choice questions for students.
Generate ${numQuestions} multiple choice questions from the following document.

${instruction}

Each question must have:
- 1 correct answer (provide the actual answer text)
- 3 plausible distractors (wrong answers that seem reasonable)
- Brief explanation of why the answer is correct
- Citation showing where the answer can be found in the source (e.g., "Page 1, paragraph 2" or "Introduction section")
- Optional hint (helpful clue without giving away the answer)
- Difficulty rating based on cognitive complexity

IMPORTANT FORMATTING RULES:
- Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or extra text.
- All strings must be properly escaped. Use double quotes for all strings.
- DO NOT prefix answers with letters like "A.", "B.", "C.", "D." - use plain text only
- The correct_answer must exactly match one of the options (case-sensitive)

Expected JSON format:
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["Paris", "London", "Berlin", "Madrid"],
      "correct_answer": "Paris",
      "explanation": "Paris is the capital and largest city of France.",
      "citation": "page 1, paragraph 3",
      "hint": "Think about the most famous city in France.",
      "difficulty": "easy"
    }
  ]
}

Document text:
${pdfText.substring(0, 30000)}`;
}

/**
 * Generate quiz using Gemini Flash
 */
export async function generateQuizWithGemini(
  pdfText: string,
  numQuestions: number = 15,
  difficulty: string = 'medium'
): Promise<QuizGenerationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }

  try {
    // Initialize the Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = buildPrompt(pdfText, numQuestions, difficulty);

    // Generate content using the SDK
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 16384,  // Significantly increased to prevent truncation
        responseMimeType: 'application/json',
      }
    });

    const response = result.response;

    // Debug: log the response structure
    console.log('Gemini response candidates:', JSON.stringify(response.candidates?.slice(0, 1), null, 2));

    const generatedText = response.text();

    if (!generatedText) {
      throw new Error('No text generated from Gemini API');
    }

    // Parse JSON from response (remove markdown if present)
    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.substring(0, jsonText.length - 3);
    }
    jsonText = jsonText.trim();

    let quizData;
    try {
      quizData = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('JSON parsing failed. Raw response:', jsonText.substring(0, 500));
      throw new Error(`Failed to parse quiz JSON: ${parseError.message}`);
    }

    // Validate response
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz data format');
    }

    // Generate quiz_id
    const quizId = `quiz-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return {
      quiz_id: quizId,
      pdf_filename: '',
      topic: 'Generated Quiz',
      difficulty_level: difficulty,
      questions: quizData.questions
    };
  } catch (error) {
    console.error('Quiz generation error:', error);
    throw error;
  }
}

/**
 * Validate quiz response schema
 */
export function validateQuizResponse(response: any): boolean {
  if (!response.questions || !Array.isArray(response.questions)) {
    return false;
  }

  for (const q of response.questions) {
    // Check required fields
    if (!q.question || !q.options || !q.correct_answer || !q.explanation) {
      return false;
    }

    // Check options array
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return false;
    }

    // Check correct_answer is in options
    if (!q.options.includes(q.correct_answer)) {
      return false;
    }

    // Check difficulty
    if (q.difficulty && !['easy', 'medium', 'hard'].includes(q.difficulty)) {
      return false;
    }
  }

  return true;
}

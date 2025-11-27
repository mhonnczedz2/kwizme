import { QuizGenerationResponse } from '@/lib/db/types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
- Optional hint (helpful clue without giving away the answer)
- Difficulty rating based on cognitive complexity

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Answer A", "Answer B", "Answer C", "Answer D"],
      "correct_answer": "Answer B",
      "explanation": "Explanation here.",
      "hint": "Think about the relationship between X and Y.",
      "difficulty": "medium"
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
    const prompt = buildPrompt(pdfText, numQuestions, difficulty);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    // Extract text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

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

    const quizData = JSON.parse(jsonText.trim());

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

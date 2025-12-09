import { QuizGenerationResponse } from '@/lib/db/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

/**
 * Validate and improve the user's description of the file content
 * If no description provided, generate one automatically
 */
export async function validateAndImproveDescription(
  file: File,
  userDescription: string | null
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Upload file to Gemini
    const fileManager = new GoogleAIFileManager(apiKey);
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await fileManager.uploadFile(
      Buffer.from(arrayBuffer),
      {
        mimeType: file.type,
        displayName: file.name,
      }
    );

    console.log('📤 Uploaded file to Gemini:', uploadResult.file.uri);

    const prompt = userDescription
      ? `You are an expert educational content analyst.

A user uploaded a file and provided this description:
"${userDescription}"

Your tasks:
1. Verify if the user's description matches the actual file content
2. If it matches: Enhance and improve the description to be more specific and helpful for quiz generation
3. If it doesn't match or is vague: Create an accurate description based on the actual content

Return a JSON object with this structure:
{
  "matches": true/false,
  "enhanced_description": "Your improved description here"
}

The enhanced_description should include:
- What the content is about (subject, topic, scope)
- What type of questions would be most appropriate (recall, application, analysis)
- Any specific focus areas or important concepts
- Appropriate difficulty level

Keep it concise (2-4 sentences max).`
      : `You are an expert educational content analyst.

A user uploaded a file but didn't provide a description.

Analyze the content and create a comprehensive description that will help generate relevant quiz questions.

Return a JSON object with this structure:
{
  "enhanced_description": "Your description here"
}

The description should include:
- What the content is about (subject, topic, scope)
- What type of questions would be most appropriate (recall, application, analysis)
- Any specific focus areas or important concepts
- Appropriate difficulty level

Keep it concise (2-4 sentences max).`;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            fileData: {
              mimeType: uploadResult.file.mimeType,
              fileUri: uploadResult.file.uri,
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
        responseMimeType: 'application/json',
      }
    });

    const response = result.response;
    const generatedText = response.text();

    // Clean up uploaded file
    try {
      await fileManager.deleteFile(uploadResult.file.name);
      console.log('🗑️ Cleaned up uploaded file');
    } catch (cleanupError) {
      console.warn('Warning: Could not delete uploaded file:', cleanupError);
    }

    if (!generatedText) {
      throw new Error('No response from Gemini API for description validation');
    }

    // Parse JSON response
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

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('Description validation JSON parse error:', parseError.message);
      console.error('Raw JSON text:', jsonText.substring(0, 500));
      // Fallback: return user description or a generic message
      return userDescription || 'Educational content for quiz generation';
    }

    // Log the validation result
    if (userDescription) {
      console.log('📝 Description validation:', parsed.matches ? 'MATCHED' : 'MISMATCH');
    }
    console.log('✨ Enhanced description:', parsed.enhanced_description);

    return parsed.enhanced_description || userDescription || 'Educational content for quiz generation';
  } catch (error) {
    console.error('Description validation error:', error);
    // Fallback: return user description or a generic message
    return userDescription || 'Educational content for quiz generation';
  }
}

/**
 * Build the prompt for quiz generation
 */
function buildPrompt(
  numQuestions: number,
  difficulty: string,
  enhancedDescription?: string,
  fileName?: string
): string {
  const difficultyInstructions = {
    easy: 'Focus on recall and basic comprehension: simple definitions, key facts, direct information from the text.',
    medium: 'Focus on application and analysis: conceptual understanding, relationships between ideas, inference from context.',
    hard: 'Focus on synthesis and evaluation: compare and contrast concepts, analyze complex scenarios, apply knowledge to novel situations.'
  };

  const instruction = difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.medium;

  // Add content context if provided
  const contextSection = enhancedDescription
    ? `\n\nCONTENT CONTEXT:\n${enhancedDescription}\n\nUse this context to guide your question generation - align questions with the content type and focus areas described above.\n`
    : '';

  // Add filename reference if provided
  const fileNameSection = fileName
    ? `\n\nSOURCE DOCUMENT: ${fileName}\nWhen creating citations, reference this filename specifically.\n`
    : '';

  return `You are an expert educator creating multiple choice questions for students.
Generate ${numQuestions} multiple choice questions from the provided document${fileName ? ` ("${fileName}")` : ''}.
${contextSection}${fileNameSection}
${instruction}

Each question must have:
- 1 correct answer (provide the actual answer text)
- 3 plausible distractors (wrong answers that seem reasonable)
- Brief explanation of why the answer is correct
- Citation showing where the answer can be found in the source (e.g., "Page 1, paragraph 2" or "Slide 5" or "Introduction section")
- Optional hint (helpful clue without giving away the answer)
- Difficulty rating based on cognitive complexity (easy, medium, hard)

IMPORTANT RULES TO FOLLOW:
- Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or extra text.
- All strings must be properly escaped. Use double quotes for all strings.
- DO NOT prefix answers with letters like "A.", "B.", "C.", "D." - use plain text only
- The correct_answer must exactly match one of the options (case-sensitive)
- In the questions, DO NOT use phrases as "in the document", be specific with questions as if no external document is need to answer the question
- In the citation, always include the source filename${fileName ? ` ("${fileName}")` : ''}
- When too much questions is asked, feel free to repeat or reword questions that are already asked
- STRICTLY follow the number of questions asked to generate. If asked for a specific number of questions, generate that number of questions only.
- DO NOT attempt to put questions outside of the material given
- Ensure that the target number of questions is achieved. No more, no less.

Expected JSON format:
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["Paris", "London", "Berlin", "Madrid"],
      "correct_answer": "Paris",
      "explanation": "Paris is the capital and largest city of France.",
      "citation": "${fileName || 'source-file'}: page 1, paragraph 3",
      "hint": "Think about the most famous city in France.",
      "difficulty": "easy"
    }
  ]
}`;
}

/**
 * Generate quiz using Gemini Flash with direct file upload
 */
export async function generateQuizWithGemini(
  file: File,
  numQuestions: number = 15,
  difficulty: string = 'medium',
  enhancedDescription?: string
): Promise<QuizGenerationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }

  try {
    // Initialize the Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Upload file to Gemini
    const fileManager = new GoogleAIFileManager(apiKey);
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await fileManager.uploadFile(
      Buffer.from(arrayBuffer),
      {
        mimeType: file.type,
        displayName: file.name,
      }
    );

    console.log('📤 Uploaded file to Gemini for quiz generation:', uploadResult.file.uri);

    const prompt = buildPrompt(numQuestions, difficulty, enhancedDescription, file.name);

    // Generate content using the SDK with file reference
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            fileData: {
              mimeType: uploadResult.file.mimeType,
              fileUri: uploadResult.file.uri,
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 60000,  // Significantly increased to prevent truncation
        responseMimeType: 'application/json',
      }
    });

    const response = result.response;

    // Clean up uploaded file
    try {
      await fileManager.deleteFile(uploadResult.file.name);
      console.log('🗑️ Cleaned up uploaded file');
    } catch (cleanupError) {
      console.warn('Warning: Could not delete uploaded file:', cleanupError);
    }

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
      quiz_title: '',
      file_name: '',
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
 * Validate quiz response schema with detailed logging
 */
export function validateQuizResponse(response: any): boolean {
  if (!response) {
    console.error('❌ Validation failed: response is null/undefined');
    return false;
  }

  if (!response.questions) {
    console.error('❌ Validation failed: response.questions is missing');
    return false;
  }

  if (!Array.isArray(response.questions)) {
    console.error('❌ Validation failed: response.questions is not an array, got:', typeof response.questions);
    return false;
  }

  if (response.questions.length === 0) {
    console.error('❌ Validation failed: response.questions is empty');
    return false;
  }

  for (let i = 0; i < response.questions.length; i++) {
    const q = response.questions[i];

    // Check required fields
    if (!q.question) {
      console.error(`❌ Validation failed: question[${i}] missing 'question' field`);
      return false;
    }
    if (!q.options) {
      console.error(`❌ Validation failed: question[${i}] missing 'options' field`);
      return false;
    }
    if (!q.correct_answer) {
      console.error(`❌ Validation failed: question[${i}] missing 'correct_answer' field`);
      return false;
    }
    if (!q.explanation) {
      console.error(`❌ Validation failed: question[${i}] missing 'explanation' field`);
      return false;
    }

    // Check options array
    if (!Array.isArray(q.options)) {
      console.error(`❌ Validation failed: question[${i}] options is not an array, got:`, typeof q.options);
      return false;
    }
    if (q.options.length !== 4) {
      console.error(`❌ Validation failed: question[${i}] has ${q.options.length} options, expected 4. Options:`, q.options);
      return false;
    }

    // Check correct_answer is in options
    if (!q.options.includes(q.correct_answer)) {
      console.error(`❌ Validation failed: question[${i}] correct_answer "${q.correct_answer}" not found in options:`, q.options);
      return false;
    }

    // Check difficulty - be lenient, just log warning for unexpected values
    const validDifficulties = ['easy', 'medium', 'hard', 'intermediate', 'high', 'low'];
    if (q.difficulty && !validDifficulties.includes(q.difficulty.toLowerCase())) {
      console.warn(`⚠️ Question[${i}] has unexpected difficulty "${q.difficulty}", normalizing to "medium"`);
      q.difficulty = 'medium'; // Normalize unexpected values instead of failing
    }
  }

  console.log(`✅ Quiz validation passed: ${response.questions.length} questions`);
  return true;
}

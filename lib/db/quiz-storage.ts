import { Database } from 'sql.js';
import { QuizGenerationResponse, Quiz, Question } from './types';
import { initDatabase, saveDatabase, executeQuery, executeUpdate } from './client';
import { SEED_QUIZZES } from './seed-data';

/**
 * Save a generated quiz to the database
 * Handles both new quizzes (INSERT) and existing quizzes (UPDATE)
 */
export async function saveQuizToDatabase(quizData: QuizGenerationResponse): Promise<void> {
  const db = await initDatabase();

  try {
    // Check if quiz already exists
    const existing = executeQuery<Quiz>(
      db,
      'SELECT quiz_id FROM quizzes WHERE quiz_id = ?',
      [quizData.quiz_id]
    );

    if (existing.length > 0) {
      // Quiz exists - update metadata
      const updateQuizSQL = `
        UPDATE quizzes
        SET quiz_title = ?,
            file_name = ?,
            description = ?,
            institution = ?,
            program = ?,
            course = ?,
            course_code = ?,
            topic = ?,
            difficulty_level = ?
        WHERE quiz_id = ?
      `;

      executeUpdate(db, updateQuizSQL, [
        quizData.quiz_title,
        quizData.file_name,
        quizData.description || null,
        quizData.institution || null,
        quizData.program || null,
        quizData.course || null,
        quizData.course_code || null,
        quizData.topic || null,
        quizData.difficulty_level,
        quizData.quiz_id
      ]);

      console.log('✅ Quiz metadata updated:', quizData.quiz_id);

      // Delete all existing questions for this quiz
      executeUpdate(db, 'DELETE FROM questions WHERE quiz_id = ?', [quizData.quiz_id]);
      console.log('✅ Deleted existing questions');
    } else {
      // New quiz - insert metadata
      const insertQuizSQL = `
        INSERT INTO quizzes (
          quiz_id,
          quiz_title,
          file_name,
          description,
          institution,
          program,
          course,
          course_code,
          topic,
          difficulty_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      executeUpdate(db, insertQuizSQL, [
        quizData.quiz_id,
        quizData.quiz_title,
        quizData.file_name,
        quizData.description || null,
        quizData.institution || null,
        quizData.program || null,
        quizData.course || null,
        quizData.course_code || null,
        quizData.topic || null,
        quizData.difficulty_level
      ]);

      console.log('✅ Quiz metadata saved:', quizData.quiz_id);
    }

    // Insert all questions
    const insertQuestionSQL = `
      INSERT INTO questions (
        quiz_id,
        question_text,
        options,
        correct_answer,
        correct_answer_index,
        explanation,
        citation,
        hint,
        difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    quizData.questions.forEach((q, index) => {
      // Debug log to check question structure
      console.log(`Question ${index + 1}:`, q);

      // Find the index of the correct answer
      const correctAnswerIndex = q.options.indexOf(q.correct_answer);

      executeUpdate(db, insertQuestionSQL, [
        quizData.quiz_id,
        q.question,
        JSON.stringify(q.options), // Store options as JSON string
        q.correct_answer,
        correctAnswerIndex,
        q.explanation,
        q.citation || null,
        q.hint || null,
        q.difficulty
      ]);
    });

    console.log(`✅ Saved ${quizData.questions.length} questions to database`);
  } catch (error) {
    console.error('❌ Error saving quiz to database:', error);
    throw error;
  }
}

/**
 * Get all quizzes from the database (metadata only)
 */
export async function getAllQuizzes(): Promise<Quiz[]> {
  const db = await initDatabase();

  const sql = `
    SELECT * FROM quizzes
    ORDER BY created_at DESC
  `;

  return executeQuery<Quiz>(db, sql);
}

/**
 * Get a specific quiz with all its questions
 */
export async function getQuizById(quizId: string): Promise<QuizGenerationResponse | null> {
  const db = await initDatabase();

  // Get quiz metadata
  const quizSQL = `SELECT * FROM quizzes WHERE quiz_id = ?`;
  const quizzes = executeQuery<Quiz>(db, quizSQL, [quizId]);

  if (quizzes.length === 0) {
    return null;
  }

  const quiz = quizzes[0];

  // Get all questions for this quiz
  const questionsSQL = `
    SELECT * FROM questions
    WHERE quiz_id = ?
    ORDER BY question_id ASC
  `;
  const questions = executeQuery<Question>(db, questionsSQL, [quizId]);

  // Transform to QuizGenerationResponse format
  return {
    quiz_id: quiz.quiz_id,
    quiz_title: quiz.quiz_title,
    file_name: quiz.file_name,
    topic: quiz.topic || 'Generated Quiz',
    difficulty_level: quiz.difficulty_level,
    institution: quiz.institution,
    program: quiz.program,
    course: quiz.course,
    course_code: quiz.course_code,
    questions: questions.map(q => ({
      question_id: q.question_id, // Include question_id for editing
      question: q.question_text,
      options: JSON.parse(q.options), // Parse JSON string back to array
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      citation: q.citation,
      hint: q.hint,
      difficulty: q.difficulty
    }))
  };
}

/**
 * Update quiz metadata (categorization details)
 */
export async function updateQuizMetadata(
  quizId: string,
  updates: {
    quiz_title?: string;
    institution?: string;
    program?: string;
    course_code?: string;
    topic?: string;
    difficulty_level?: string;
  }
): Promise<void> {
  const db = await initDatabase();

  try {
    const sql = `
      UPDATE quizzes
      SET quiz_title = ?,
          institution = ?,
          program = ?,
          course_code = ?,
          topic = ?,
          difficulty_level = ?
      WHERE quiz_id = ?
    `;

    executeUpdate(db, sql, [
      updates.quiz_title,
      updates.institution || null,
      updates.program || null,
      updates.course_code || null,
      updates.topic || null,
      updates.difficulty_level,
      quizId
    ]);

    console.log(`✅ Updated quiz metadata: ${quizId}`);
  } catch (error) {
    console.error('❌ Error updating quiz metadata:', error);
    throw error;
  }
}

/**
 * Delete a quiz and all its questions
 */
export async function deleteQuiz(quizId: string): Promise<void> {
  const db = await initDatabase();

  try {
    // Delete questions first (foreign key constraint)
    executeUpdate(db, 'DELETE FROM questions WHERE quiz_id = ?', [quizId]);

    // Delete quiz
    executeUpdate(db, 'DELETE FROM quizzes WHERE quiz_id = ?', [quizId]);

    console.log(`✅ Deleted quiz: ${quizId}`);
  } catch (error) {
    console.error('❌ Error deleting quiz:', error);
    throw error;
  }
}

/**
 * Get total question count for a specific quiz
 */
export async function getQuizQuestionCount(quizId: string): Promise<number> {
  const db = await initDatabase();

  const result = executeQuery<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM questions WHERE quiz_id = ?',
    [quizId]
  );

  return result[0]?.count || 0;
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(questionId: number): Promise<Question | null> {
  const db = await initDatabase();

  const questions = executeQuery<Question>(
    db,
    'SELECT * FROM questions WHERE question_id = ?',
    [questionId]
  );

  return questions.length > 0 ? questions[0] : null;
}

/**
 * Update a question
 */
export async function updateQuestion(
  questionId: number,
  updates: {
    question_text?: string;
    options?: string[];
    correct_answer?: string;
    explanation?: string;
    citation?: string;
    hint?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }
): Promise<void> {
  const db = await initDatabase();

  try {
    // Get current question to merge updates
    const current = await getQuestionById(questionId);
    if (!current) {
      throw new Error(`Question ${questionId} not found`);
    }

    // Find correct answer index if correct_answer or options changed
    const finalOptions = updates.options || JSON.parse(current.options);
    const finalCorrectAnswer = updates.correct_answer || current.correct_answer;
    const correctAnswerIndex = finalOptions.indexOf(finalCorrectAnswer);

    if (correctAnswerIndex === -1) {
      throw new Error('Correct answer must be one of the options');
    }

    const sql = `
      UPDATE questions
      SET question_text = ?,
          options = ?,
          correct_answer = ?,
          correct_answer_index = ?,
          explanation = ?,
          citation = ?,
          hint = ?,
          difficulty = ?
      WHERE question_id = ?
    `;

    executeUpdate(db, sql, [
      updates.question_text !== undefined ? updates.question_text : current.question_text,
      updates.options ? JSON.stringify(updates.options) : current.options,
      finalCorrectAnswer,
      correctAnswerIndex,
      updates.explanation !== undefined ? updates.explanation : current.explanation,
      updates.citation !== undefined ? updates.citation || null : current.citation,
      updates.hint !== undefined ? updates.hint || null : current.hint,
      updates.difficulty !== undefined ? updates.difficulty : current.difficulty,
      questionId
    ]);

    console.log(`✅ Updated question: ${questionId}`);
  } catch (error) {
    console.error('❌ Error updating question:', error);
    throw error;
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: number): Promise<void> {
  const db = await initDatabase();

  try {
    // Delete associated answer records first (foreign key constraint)
    executeUpdate(db, 'DELETE FROM answer_records WHERE question_id = ?', [questionId]);

    // Delete the question
    executeUpdate(db, 'DELETE FROM questions WHERE question_id = ?', [questionId]);

    console.log(`✅ Deleted question: ${questionId}`);
  } catch (error) {
    console.error('❌ Error deleting question:', error);
    throw error;
  }
}

/**
 * Add a new question to an existing quiz
 */
export async function addQuestionToQuiz(
  quizId: string,
  question: {
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    citation?: string;
    hint?: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }
): Promise<number> {
  const db = await initDatabase();

  try {
    // Validate correct answer is one of the options
    const correctAnswerIndex = question.options.indexOf(question.correct_answer);
    if (correctAnswerIndex === -1) {
      throw new Error('Correct answer must be one of the options');
    }

    const sql = `
      INSERT INTO questions (
        quiz_id,
        question_text,
        options,
        correct_answer,
        correct_answer_index,
        explanation,
        citation,
        hint,
        difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    executeUpdate(db, sql, [
      quizId,
      question.question_text,
      JSON.stringify(question.options),
      question.correct_answer,
      correctAnswerIndex,
      question.explanation,
      question.citation || null,
      question.hint || null,
      question.difficulty
    ]);

    // Get the newly inserted question ID
    const result = executeQuery<{ question_id: number }>(
      db,
      'SELECT question_id FROM questions WHERE quiz_id = ? ORDER BY question_id DESC LIMIT 1',
      [quizId]
    );

    const newQuestionId = result[0]?.question_id;
    console.log(`✅ Added new question: ${newQuestionId}`);

    return newQuestionId;
  } catch (error) {
    console.error('❌ Error adding question:', error);
    throw error;
  }
}

/**
 * Seed the database with default quizzes
 * Runs on every app load but skips quizzes that already exist
 */
export async function seedDefaultQuizzes(): Promise<void> {
  const db = await initDatabase();

  try {
    console.log('📦 Checking for seed quizzes...');

    // Check each seed quiz individually
    for (const seedQuiz of SEED_QUIZZES) {
      const existing = executeQuery<Quiz>(
        db,
        'SELECT quiz_id FROM quizzes WHERE quiz_id = ?',
        [seedQuiz.quiz_id]
      );

      if (existing.length === 0) {
        // Quiz doesn't exist, insert it
        console.log(`📝 Adding seed quiz: ${seedQuiz.quiz_title}`);
        await saveQuizToDatabase(seedQuiz);
      } else {
        console.log(`✓ Seed quiz already exists: ${seedQuiz.quiz_title}`);
      }
    }

    console.log('✅ Seed quiz check complete');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    // Don't throw - seeding is optional
  }
}

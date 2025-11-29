import { Database } from 'sql.js';
import { QuizGenerationResponse, Quiz, Question } from './types';
import { initDatabase, saveDatabase, executeQuery, executeUpdate } from './client';

/**
 * Save a generated quiz to the database
 */
export async function saveQuizToDatabase(quizData: QuizGenerationResponse): Promise<void> {
  const db = await initDatabase();

  try {
    // Insert quiz metadata
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

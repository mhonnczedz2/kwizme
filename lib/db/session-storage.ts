import { initDatabase, executeQuery, executeUpdate } from './client';
import { ReviewSession, AnswerRecord } from './types';

// Generate UUID in browser-compatible way
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a new quiz session
 */
export async function createSession(
  quizId: string,
  totalQuestions: number,
  config?: {
    quick_submit?: boolean;
    show_explanation?: boolean;
    time_limit_seconds?: number;
    randomize_options?: boolean;
    randomize_questions?: boolean;
    num_questions_selected?: number;
    preset_name?: string;
  }
): Promise<string> {
  const db = await initDatabase();
  const sessionId = generateUUID();

  const sql = `
    INSERT INTO review_sessions (
      session_id,
      quiz_id,
      started_at,
      total_questions,
      quick_submit,
      show_explanation,
      time_limit_seconds,
      randomize_options,
      randomize_questions,
      num_questions_selected,
      preset_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  executeUpdate(db, sql, [
    sessionId,
    quizId,
    new Date().toISOString(),
    totalQuestions,
    config?.quick_submit ?? false,
    config?.show_explanation ?? true,
    config?.time_limit_seconds ?? null,
    config?.randomize_options ?? false,
    config?.randomize_questions ?? false,
    config?.num_questions_selected ?? totalQuestions,
    config?.preset_name ?? 'custom'
  ]);

  console.log('✅ Session created:', sessionId);
  return sessionId;
}

/**
 * Save an answer record
 */
export async function saveAnswer(
  sessionId: string,
  questionId: number,
  selectedAnswerIndex: number,
  isCorrect: boolean,
  timeSpentSeconds?: number
): Promise<void> {
  const db = await initDatabase();

  const sql = `
    INSERT INTO answer_records (
      session_id,
      question_id,
      selected_answer_index,
      is_correct,
      time_spent_seconds,
      answered_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  executeUpdate(db, sql, [
    sessionId,
    questionId,
    selectedAnswerIndex,
    isCorrect,
    timeSpentSeconds ?? null,
    new Date().toISOString()
  ]);
}

/**
 * Complete a session with final score
 */
export async function completeSession(
  sessionId: string,
  correctAnswers: number,
  totalQuestions: number,
  timeSpentSeconds?: number
): Promise<void> {
  const db = await initDatabase();

  const scorePercentage = (correctAnswers / totalQuestions) * 100;

  const sql = `
    UPDATE review_sessions
    SET completed_at = ?,
        correct_answers = ?,
        score_percentage = ?,
        time_spent_seconds = ?
    WHERE session_id = ?
  `;

  executeUpdate(db, sql, [
    new Date().toISOString(),
    correctAnswers,
    scorePercentage,
    timeSpentSeconds ?? null,
    sessionId
  ]);

  console.log('✅ Session completed:', sessionId, `Score: ${correctAnswers}/${totalQuestions}`);
}

/**
 * Get all sessions for a quiz
 */
export async function getSessionsForQuiz(quizId: string): Promise<ReviewSession[]> {
  const db = await initDatabase();

  const sql = `
    SELECT * FROM review_sessions
    WHERE quiz_id = ?
    ORDER BY started_at DESC
  `;

  return executeQuery<ReviewSession>(db, sql, [quizId]);
}

/**
 * Get the most recent completed session for a quiz
 */
export async function getMostRecentSession(quizId: string): Promise<ReviewSession | null> {
  const db = await initDatabase();

  const sql = `
    SELECT * FROM review_sessions
    WHERE quiz_id = ? AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 1
  `;

  const sessions = executeQuery<ReviewSession>(db, sql, [quizId]);
  return sessions.length > 0 ? sessions[0] : null;
}

/**
 * Get a specific session by ID
 */
export async function getSessionById(sessionId: string): Promise<ReviewSession | null> {
  const db = await initDatabase();

  const sql = `SELECT * FROM review_sessions WHERE session_id = ?`;
  const sessions = executeQuery<ReviewSession>(db, sql, [sessionId]);

  return sessions.length > 0 ? sessions[0] : null;
}

/**
 * Get all answer records for a session
 */
export async function getAnswersForSession(sessionId: string): Promise<AnswerRecord[]> {
  const db = await initDatabase();

  const sql = `
    SELECT * FROM answer_records
    WHERE session_id = ?
    ORDER BY record_id ASC
  `;

  return executeQuery<AnswerRecord>(db, sql, [sessionId]);
}

/**
 * Get session with answers (for review view)
 */
export interface SessionWithAnswers {
  session: ReviewSession;
  answers: AnswerRecord[];
}

export async function getSessionWithAnswers(sessionId: string): Promise<SessionWithAnswers | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const answers = await getAnswersForSession(sessionId);

  return { session, answers };
}

/**
 * Delete all sessions for a quiz (when quiz is deleted)
 */
export async function deleteSessionsForQuiz(quizId: string): Promise<void> {
  const db = await initDatabase();

  // Get all session IDs for this quiz
  const sessions = await getSessionsForQuiz(quizId);

  // Delete answer records for each session
  for (const session of sessions) {
    executeUpdate(db, 'DELETE FROM answer_records WHERE session_id = ?', [session.session_id]);
  }

  // Delete sessions
  executeUpdate(db, 'DELETE FROM review_sessions WHERE quiz_id = ?', [quizId]);

  console.log(`✅ Deleted ${sessions.length} sessions for quiz: ${quizId}`);
}

/**
 * Get the most recently taken quizzes (by completed session)
 */
export async function getRecentQuizSessions(limit: number = 5): Promise<string[]> {
  const db = await initDatabase();

  const sql = `
    SELECT DISTINCT quiz_id
    FROM review_sessions
    WHERE completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT ?
  `;

  const results = executeQuery<{ quiz_id: string }>(db, sql, [limit]);
  return results.map(r => r.quiz_id);
}

import { createClient } from '@/lib/supabase/client'
import type { QuizGenerationResponse, Quiz, Question } from '@/lib/db/types'

/**
 * Supabase Quiz Storage - Cloud storage for authenticated users
 * Uses Supabase PostgreSQL database with Row Level Security
 */

/**
 * Save a generated quiz to Supabase (cloud storage)
 * Handles both new quizzes (INSERT) and existing quizzes (UPDATE)
 */
export async function saveQuizToSupabase(
  quizData: QuizGenerationResponse,
  userId: string
): Promise<void> {
  const supabase = createClient()

  try {
    // Check if quiz already exists
    const { data: existing, error: checkError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('quiz_id', quizData.quiz_id)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new quizzes)
      throw checkError
    }

    if (existing) {
      // Quiz exists - update metadata
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({
          quiz_title: quizData.quiz_title,
          file_name: quizData.file_name,
          description: quizData.description || null,
          institution: quizData.institution || null,
          program: quizData.program || null,
          course: quizData.course || null,
          course_code: quizData.course_code || null,
          topic: quizData.topic || null,
          difficulty_level: quizData.difficulty_level,
          updated_at: new Date().toISOString()
        })
        .eq('quiz_id', quizData.quiz_id)
        .eq('user_id', userId)

      if (updateError) throw updateError

      console.log('☁️ Quiz metadata updated in Supabase:', quizData.quiz_id)

      // Delete all existing questions for this quiz
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizData.quiz_id)

      if (deleteError) throw deleteError

      console.log('☁️ Deleted existing questions from Supabase')
    } else {
      // New quiz - insert metadata
      const { error: insertError } = await supabase
        .from('quizzes')
        .insert({
          user_id: userId,
          quiz_id: quizData.quiz_id,
          quiz_title: quizData.quiz_title,
          file_name: quizData.file_name,
          description: quizData.description || null,
          institution: quizData.institution || null,
          program: quizData.program || null,
          course: quizData.course || null,
          course_code: quizData.course_code || null,
          topic: quizData.topic || null,
          difficulty_level: quizData.difficulty_level
        })

      if (insertError) throw insertError

      console.log('☁️ Quiz metadata saved to Supabase:', quizData.quiz_id)
    }

    // Insert all questions
    const questionsToInsert = quizData.questions.map((q) => {
      const correctAnswerIndex = q.options.indexOf(q.correct_answer)

      return {
        quiz_id: quizData.quiz_id,
        question_text: q.question,
        options: q.options, // Supabase uses JSONB, no need to stringify
        correct_answer: q.correct_answer,
        correct_answer_index: correctAnswerIndex,
        explanation: q.explanation,
        citation: q.citation || null,
        hint: q.hint || null,
        difficulty: q.difficulty
      }
    })

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert)

    if (questionsError) throw questionsError

    console.log(`☁️ Saved ${quizData.questions.length} questions to Supabase`)
  } catch (error) {
    console.error('❌ Error saving quiz to Supabase:', error)
    throw error
  }
}

/**
 * Get all quizzes from Supabase for the current user (metadata only)
 */
export async function getAllQuizzesFromSupabase(userId: string): Promise<Quiz[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching quizzes from Supabase:', error)
    throw error
  }

  return data || []
}

/**
 * Get a specific quiz with all its questions from Supabase
 */
export async function getQuizByIdFromSupabase(
  quizId: string,
  userId: string
): Promise<QuizGenerationResponse | null> {
  const supabase = createClient()

  // Get quiz metadata
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .single()

  if (quizError) {
    if (quizError.code === 'PGRST116') {
      // No rows found
      return null
    }
    console.error('❌ Error fetching quiz from Supabase:', quizError)
    throw quizError
  }

  if (!quiz) return null

  // Get all questions for this quiz
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('id', { ascending: true })

  if (questionsError) {
    console.error('❌ Error fetching questions from Supabase:', questionsError)
    throw questionsError
  }

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
    description: quiz.description,
    questions: (questions || []).map((q: any) => ({
      question_id: q.id, // Supabase uses 'id' not 'question_id'
      question: q.question_text,
      options: q.options, // Already parsed from JSONB
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      citation: q.citation,
      hint: q.hint,
      difficulty: q.difficulty
    }))
  }
}

/**
 * Update quiz metadata in Supabase
 */
export async function updateQuizMetadataInSupabase(
  quizId: string,
  userId: string,
  updates: {
    quiz_title?: string
    institution?: string
    program?: string
    course_code?: string
    topic?: string
    difficulty_level?: string
  }
): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('quizzes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('quiz_id', quizId)
      .eq('user_id', userId)

    if (error) throw error

    console.log(`☁️ Updated quiz metadata in Supabase: ${quizId}`)
  } catch (error) {
    console.error('❌ Error updating quiz metadata in Supabase:', error)
    throw error
  }
}

/**
 * Delete a quiz and all its questions from Supabase
 */
export async function deleteQuizFromSupabase(
  quizId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  try {
    // Delete questions first (foreign key constraint)
    const { error: questionsError } = await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId)

    if (questionsError) throw questionsError

    // Delete quiz
    const { error: quizError } = await supabase
      .from('quizzes')
      .delete()
      .eq('quiz_id', quizId)
      .eq('user_id', userId)

    if (quizError) throw quizError

    console.log(`☁️ Deleted quiz from Supabase: ${quizId}`)
  } catch (error) {
    console.error('❌ Error deleting quiz from Supabase:', error)
    throw error
  }
}

/**
 * Get total question count for a specific quiz in Supabase
 */
export async function getQuizQuestionCountFromSupabase(
  quizId: string
): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('quiz_id', quizId)

  if (error) {
    console.error('❌ Error counting questions in Supabase:', error)
    throw error
  }

  return count || 0
}

/**
 * Get a single question by ID from Supabase
 */
export async function getQuestionByIdFromSupabase(
  questionId: number
): Promise<Question | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('❌ Error fetching question from Supabase:', error)
    throw error
  }

  if (!data) return null

  // Transform to match local Question type
  return {
    question_id: data.id,
    quiz_id: data.quiz_id,
    question_text: data.question_text,
    options: JSON.stringify(data.options), // Convert back to string for compatibility
    correct_answer: data.correct_answer,
    correct_answer_index: data.correct_answer_index,
    explanation: data.explanation,
    citation: data.citation,
    hint: data.hint,
    difficulty: data.difficulty
  }
}

/**
 * Update a question in Supabase
 */
export async function updateQuestionInSupabase(
  questionId: number,
  updates: {
    question_text?: string
    options?: string[]
    correct_answer?: string
    explanation?: string
    citation?: string
    hint?: string
    difficulty?: 'easy' | 'medium' | 'hard'
  }
): Promise<void> {
  const supabase = createClient()

  try {
    // Get current question
    const current = await getQuestionByIdFromSupabase(questionId)
    if (!current) {
      throw new Error(`Question ${questionId} not found`)
    }

    // Calculate correct answer index
    const finalOptions = updates.options || JSON.parse(current.options)
    const finalCorrectAnswer = updates.correct_answer || current.correct_answer
    const correctAnswerIndex = finalOptions.indexOf(finalCorrectAnswer)

    if (correctAnswerIndex === -1) {
      throw new Error('Correct answer must be one of the options')
    }

    const { error } = await supabase
      .from('questions')
      .update({
        question_text: updates.question_text !== undefined ? updates.question_text : current.question_text,
        options: updates.options || JSON.parse(current.options),
        correct_answer: finalCorrectAnswer,
        correct_answer_index: correctAnswerIndex,
        explanation: updates.explanation !== undefined ? updates.explanation : current.explanation,
        citation: updates.citation !== undefined ? updates.citation || null : current.citation,
        hint: updates.hint !== undefined ? updates.hint || null : current.hint,
        difficulty: updates.difficulty !== undefined ? updates.difficulty : current.difficulty
      })
      .eq('id', questionId)

    if (error) throw error

    console.log(`☁️ Updated question in Supabase: ${questionId}`)
  } catch (error) {
    console.error('❌ Error updating question in Supabase:', error)
    throw error
  }
}

/**
 * Delete a question from Supabase
 */
export async function deleteQuestionFromSupabase(questionId: number): Promise<void> {
  const supabase = createClient()

  try {
    // Delete associated answer records first (foreign key constraint)
    const { error: answersError } = await supabase
      .from('answer_records')
      .delete()
      .eq('question_id', questionId)

    if (answersError) throw answersError

    // Delete the question
    const { error: questionError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (questionError) throw questionError

    console.log(`☁️ Deleted question from Supabase: ${questionId}`)
  } catch (error) {
    console.error('❌ Error deleting question from Supabase:', error)
    throw error
  }
}

/**
 * Add a new question to an existing quiz in Supabase
 */
export async function addQuestionToQuizInSupabase(
  quizId: string,
  question: {
    question_text: string
    options: string[]
    correct_answer: string
    explanation: string
    citation?: string
    hint?: string
    difficulty: 'easy' | 'medium' | 'hard'
  }
): Promise<number> {
  const supabase = createClient()

  try {
    // Validate correct answer is one of the options
    const correctAnswerIndex = question.options.indexOf(question.correct_answer)
    if (correctAnswerIndex === -1) {
      throw new Error('Correct answer must be one of the options')
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        quiz_id: quizId,
        question_text: question.question_text,
        options: question.options, // JSONB in Supabase
        correct_answer: question.correct_answer,
        correct_answer_index: correctAnswerIndex,
        explanation: question.explanation,
        citation: question.citation || null,
        hint: question.hint || null,
        difficulty: question.difficulty
      })
      .select('id')
      .single()

    if (error) throw error

    const newQuestionId = data.id
    console.log(`☁️ Added new question to Supabase: ${newQuestionId}`)

    return newQuestionId
  } catch (error) {
    console.error('❌ Error adding question to Supabase:', error)
    throw error
  }
}

-- Enable Realtime for QuizMe Tables
-- Run this after creating the main schema
-- This enables real-time subscriptions for quiz and session changes

-- Enable realtime on the quizzes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes;

-- Enable realtime on the questions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;

-- Enable realtime on the review_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_sessions;

-- Enable realtime on the answer_records table
ALTER PUBLICATION supabase_realtime ADD TABLE public.answer_records;

-- Verify realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Realtime enabled for all QuizMe tables!';
    RAISE NOTICE 'Tables: quizzes, questions, review_sessions, answer_records';
END $$;

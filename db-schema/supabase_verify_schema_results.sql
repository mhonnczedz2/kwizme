-- Schema Verification Script for QuizMe (Results Version)
-- Run this in Supabase SQL Editor to verify your database schema
-- This version returns a results table you can see in the Results tab

WITH verification_checks AS (
    SELECT
        '1. Tables' AS category,
        'profiles' AS item,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status,
        1 AS sort_order
    UNION ALL
    SELECT '1. Tables', 'quizzes',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quizzes')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 2
    UNION ALL
    SELECT '1. Tables', 'questions',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 3
    UNION ALL
    SELECT '1. Tables', 'review_sessions',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_sessions')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 4
    UNION ALL
    SELECT '1. Tables', 'answer_records',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'answer_records')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 5

    -- Column checks
    UNION ALL
    SELECT '2. Columns', 'profiles.institution',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'institution')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 6
    UNION ALL
    SELECT '2. Columns', 'profiles.program',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'program')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 7
    UNION ALL
    SELECT '2. Columns', 'quizzes.quiz_id (TEXT type)',
        CASE WHEN (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'quiz_id') = 'text'
            THEN '✅ CORRECT TYPE' ELSE '❌ WRONG TYPE' END, 8
    UNION ALL
    SELECT '2. Columns', 'quizzes.institution',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'institution')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 9
    UNION ALL
    SELECT '2. Columns', 'quizzes.program',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'program')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 10
    UNION ALL
    SELECT '2. Columns', 'quizzes.course',
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'course')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 11

    -- RLS checks
    UNION ALL
    SELECT '3. Row Level Security', 'profiles',
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity = true)
            THEN '✅ ENABLED' ELSE '❌ DISABLED' END, 12
    UNION ALL
    SELECT '3. Row Level Security', 'quizzes',
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quizzes' AND rowsecurity = true)
            THEN '✅ ENABLED' ELSE '❌ DISABLED' END, 13
    UNION ALL
    SELECT '3. Row Level Security', 'questions',
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'questions' AND rowsecurity = true)
            THEN '✅ ENABLED' ELSE '❌ DISABLED' END, 14
    UNION ALL
    SELECT '3. Row Level Security', 'review_sessions',
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'review_sessions' AND rowsecurity = true)
            THEN '✅ ENABLED' ELSE '❌ DISABLED' END, 15
    UNION ALL
    SELECT '3. Row Level Security', 'answer_records',
        CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'answer_records' AND rowsecurity = true)
            THEN '✅ ENABLED' ELSE '❌ DISABLED' END, 16

    -- Index checks
    UNION ALL
    SELECT '4. Indexes', 'idx_quizzes_user_id',
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_quizzes_user_id')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 17
    UNION ALL
    SELECT '4. Indexes', 'idx_questions_quiz_id',
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_questions_quiz_id')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 18
    UNION ALL
    SELECT '4. Indexes', 'idx_review_sessions_user_id',
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_review_sessions_user_id')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 19
    UNION ALL
    SELECT '4. Indexes', 'idx_answer_records_session_id',
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_answer_records_session_id')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 20

    -- Function checks
    UNION ALL
    SELECT '5. Functions', 'handle_new_user()',
        CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 21
    UNION ALL
    SELECT '5. Functions', 'update_updated_at_column()',
        CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 22

    -- Trigger checks
    UNION ALL
    SELECT '6. Triggers', 'on_auth_user_created',
        CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 23
    UNION ALL
    SELECT '6. Triggers', 'update_profiles_updated_at',
        CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 24
    UNION ALL
    SELECT '6. Triggers', 'update_quizzes_updated_at',
        CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quizzes_updated_at')
            THEN '✅ EXISTS' ELSE '❌ MISSING' END, 25

    -- Realtime checks
    UNION ALL
    SELECT '7. Realtime', 'quizzes',
        CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'quizzes')
            THEN '✅ ENABLED' ELSE '⚠️ DISABLED' END, 26
    UNION ALL
    SELECT '7. Realtime', 'questions',
        CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'questions')
            THEN '✅ ENABLED' ELSE '⚠️ DISABLED' END, 27
    UNION ALL
    SELECT '7. Realtime', 'review_sessions',
        CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'review_sessions')
            THEN '✅ ENABLED' ELSE '⚠️ DISABLED' END, 28
    UNION ALL
    SELECT '7. Realtime', 'answer_records',
        CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'answer_records')
            THEN '✅ ENABLED' ELSE '⚠️ DISABLED' END, 29
)
SELECT
    category,
    item,
    status
FROM verification_checks
ORDER BY sort_order;

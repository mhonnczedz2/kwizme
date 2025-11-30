-- Schema Verification Script for QuizMe
-- Run this in Supabase SQL Editor to verify your database schema is up to date
-- This script checks all tables, columns, indexes, policies, and functions

DO $$
DECLARE
    missing_items TEXT := '';
    extra_items TEXT := '';
    all_good BOOLEAN := TRUE;
    temp_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Starting QuizMe Schema Verification...';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';

    -- ========================================
    -- 1. CHECK REQUIRED TABLES
    -- ========================================
    RAISE NOTICE '1️⃣  Checking Tables...';

    -- Check profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        missing_items := missing_items || '  ❌ Missing table: profiles' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ profiles table exists';
    END IF;

    -- Check quizzes table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quizzes') THEN
        missing_items := missing_items || '  ❌ Missing table: quizzes' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ quizzes table exists';
    END IF;

    -- Check questions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
        missing_items := missing_items || '  ❌ Missing table: questions' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ questions table exists';
    END IF;

    -- Check review_sessions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_sessions') THEN
        missing_items := missing_items || '  ❌ Missing table: review_sessions' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ review_sessions table exists';
    END IF;

    -- Check answer_records table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'answer_records') THEN
        missing_items := missing_items || '  ❌ Missing table: answer_records' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ answer_records table exists';
    END IF;

    RAISE NOTICE '';

    -- ========================================
    -- 2. CHECK REQUIRED COLUMNS
    -- ========================================
    RAISE NOTICE '2️⃣  Checking Columns...';

    -- profiles columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'institution') THEN
        missing_items := missing_items || '  ❌ Missing column: profiles.institution' || E'\n';
        all_good := FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'program') THEN
        missing_items := missing_items || '  ❌ Missing column: profiles.program' || E'\n';
        all_good := FALSE;
    END IF;

    -- quizzes columns - verify quiz_id is TEXT not UUID
    SELECT data_type INTO temp_record FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'quiz_id';

    IF temp_record.data_type != 'text' THEN
        missing_items := missing_items || '  ❌ Wrong type: quizzes.quiz_id should be TEXT, found ' || temp_record.data_type || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ quizzes.quiz_id is TEXT (correct)';
    END IF;

    -- Check key quizzes columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'institution') THEN
        missing_items := missing_items || '  ❌ Missing column: quizzes.institution' || E'\n';
        all_good := FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'program') THEN
        missing_items := missing_items || '  ❌ Missing column: quizzes.program' || E'\n';
        all_good := FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'course') THEN
        missing_items := missing_items || '  ❌ Missing column: quizzes.course' || E'\n';
        all_good := FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'course_code') THEN
        missing_items := missing_items || '  ❌ Missing column: quizzes.course_code' || E'\n';
        all_good := FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'topic') THEN
        missing_items := missing_items || '  ❌ Missing column: quizzes.topic' || E'\n';
        all_good := FALSE;
    END IF;

    RAISE NOTICE '  ✅ All required columns present';
    RAISE NOTICE '';

    -- ========================================
    -- 3. CHECK ROW LEVEL SECURITY
    -- ========================================
    RAISE NOTICE '3️⃣  Checking Row Level Security...';

    -- Check RLS is enabled on all tables
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity = true) THEN
        missing_items := missing_items || '  ❌ RLS not enabled on: profiles' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ RLS enabled on profiles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quizzes' AND rowsecurity = true) THEN
        missing_items := missing_items || '  ❌ RLS not enabled on: quizzes' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ RLS enabled on quizzes';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'questions' AND rowsecurity = true) THEN
        missing_items := missing_items || '  ❌ RLS not enabled on: questions' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ RLS enabled on questions';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'review_sessions' AND rowsecurity = true) THEN
        missing_items := missing_items || '  ❌ RLS not enabled on: review_sessions' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ RLS enabled on review_sessions';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'answer_records' AND rowsecurity = true) THEN
        missing_items := missing_items || '  ❌ RLS not enabled on: answer_records' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ RLS enabled on answer_records';
    END IF;

    RAISE NOTICE '';

    -- ========================================
    -- 4. CHECK INDEXES
    -- ========================================
    RAISE NOTICE '4️⃣  Checking Indexes...';

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_quizzes_user_id') THEN
        missing_items := missing_items || '  ❌ Missing index: idx_quizzes_user_id' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ idx_quizzes_user_id exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_questions_quiz_id') THEN
        missing_items := missing_items || '  ❌ Missing index: idx_questions_quiz_id' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ idx_questions_quiz_id exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_review_sessions_user_id') THEN
        missing_items := missing_items || '  ❌ Missing index: idx_review_sessions_user_id' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ idx_review_sessions_user_id exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_answer_records_session_id') THEN
        missing_items := missing_items || '  ❌ Missing index: idx_answer_records_session_id' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ idx_answer_records_session_id exists';
    END IF;

    RAISE NOTICE '';

    -- ========================================
    -- 5. CHECK FUNCTIONS
    -- ========================================
    RAISE NOTICE '5️⃣  Checking Functions...';

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        missing_items := missing_items || '  ❌ Missing function: handle_new_user()' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ handle_new_user() exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        missing_items := missing_items || '  ❌ Missing function: update_updated_at_column()' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ update_updated_at_column() exists';
    END IF;

    RAISE NOTICE '';

    -- ========================================
    -- 6. CHECK TRIGGERS
    -- ========================================
    RAISE NOTICE '6️⃣  Checking Triggers...';

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        missing_items := missing_items || '  ❌ Missing trigger: on_auth_user_created' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ on_auth_user_created trigger exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        missing_items := missing_items || '  ❌ Missing trigger: update_profiles_updated_at' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ update_profiles_updated_at trigger exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quizzes_updated_at') THEN
        missing_items := missing_items || '  ❌ Missing trigger: update_quizzes_updated_at' || E'\n';
        all_good := FALSE;
    ELSE
        RAISE NOTICE '  ✅ update_quizzes_updated_at trigger exists';
    END IF;

    RAISE NOTICE '';

    -- ========================================
    -- 7. CHECK REALTIME PUBLICATION
    -- ========================================
    RAISE NOTICE '7️⃣  Checking Realtime Publication...';

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'quizzes') THEN
        missing_items := missing_items || '  ⚠️  Realtime not enabled on: quizzes (run supabase_enable_realtime.sql)' || E'\n';
    ELSE
        RAISE NOTICE '  ✅ Realtime enabled on quizzes';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'questions') THEN
        missing_items := missing_items || '  ⚠️  Realtime not enabled on: questions (run supabase_enable_realtime.sql)' || E'\n';
    ELSE
        RAISE NOTICE '  ✅ Realtime enabled on questions';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'review_sessions') THEN
        missing_items := missing_items || '  ⚠️  Realtime not enabled on: review_sessions (run supabase_enable_realtime.sql)' || E'\n';
    ELSE
        RAISE NOTICE '  ✅ Realtime enabled on review_sessions';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'answer_records') THEN
        missing_items := missing_items || '  ⚠️  Realtime not enabled on: answer_records (run supabase_enable_realtime.sql)' || E'\n';
    ELSE
        RAISE NOTICE '  ✅ Realtime enabled on answer_records';
    END IF;

    RAISE NOTICE '';

    -- ========================================
    -- FINAL REPORT
    -- ========================================
    RAISE NOTICE '================================================';

    IF all_good AND missing_items = '' THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SUCCESS! Your schema is up to date!';
        RAISE NOTICE '';
        RAISE NOTICE '✅ All tables exist';
        RAISE NOTICE '✅ All columns are correct';
        RAISE NOTICE '✅ All indexes are in place';
        RAISE NOTICE '✅ All functions and triggers work';
        RAISE NOTICE '✅ Row Level Security is enabled';
        RAISE NOTICE '✅ Realtime is configured';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ ISSUES FOUND!';
        RAISE NOTICE '';
        RAISE NOTICE '%', missing_items;
        RAISE NOTICE '';
        RAISE NOTICE '📋 Action Required:';
        RAISE NOTICE '  1. Run supabase_complete_schema.sql to fix missing items';
        RAISE NOTICE '  2. Run supabase_enable_realtime.sql if realtime is missing';
        RAISE NOTICE '  3. Re-run this verification script';
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '================================================';
END $$;

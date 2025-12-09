-- ============================================================================
-- CLEAR ALL DATA FROM KWIZME DATABASE (DEVELOPMENT ONLY)
-- ============================================================================
--
-- PURPOSE: Remove all data from the database while preserving the schema
-- USE CASE: Development/Testing - allows re-signup with same email
--
-- ⚠️  WARNING: THIS WILL DELETE ALL DATA PERMANENTLY!
-- ⚠️  DO NOT RUN THIS IN PRODUCTION!
--
-- WHAT THIS DOES:
-- 1. Deletes all user data from public tables
-- 2. Deletes all users from auth.users (requires Supabase Dashboard access)
-- 3. Preserves all table schemas, indexes, policies, and functions
-- 4. Resets auto-increment sequences
--
-- HOW TO USE:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Review the warnings below
-- 4. Run the script
--
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: You are about to delete ALL data from the database!';
    RAISE NOTICE '⚠️  This action CANNOT be undone!';
    RAISE NOTICE '';
    RAISE NOTICE 'Starting data cleanup in 3 seconds...';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: Delete all data from public tables
-- ============================================================================
--
-- ORDER MATTERS: Delete in reverse dependency order to avoid FK violations
-- (Though CASCADE should handle it, explicit order is safer)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📋 Step 1/7: Deleting answer_records...';
END $$;

TRUNCATE TABLE public.answer_records RESTART IDENTITY CASCADE;

DO $$
BEGIN
    RAISE NOTICE '📋 Step 2/7: Deleting review_sessions...';
END $$;

TRUNCATE TABLE public.review_sessions RESTART IDENTITY CASCADE;

DO $$
BEGIN
    RAISE NOTICE '📋 Step 3/7: Deleting questions...';
END $$;

TRUNCATE TABLE public.questions RESTART IDENTITY CASCADE;

DO $$
BEGIN
    RAISE NOTICE '📋 Step 4/7: Deleting quizzes...';
END $$;

TRUNCATE TABLE public.quizzes CASCADE;

DO $$
BEGIN
    RAISE NOTICE '📋 Step 5/7: Deleting rate limiting data (daily_usage, user_limits, quiz_usage)...';
END $$;

TRUNCATE TABLE public.daily_usage RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.user_limits RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.quiz_usage RESTART IDENTITY CASCADE;

DO $$
BEGIN
    RAISE NOTICE '📋 Step 6/7: Deleting profiles...';
END $$;

TRUNCATE TABLE public.profiles CASCADE;

-- ============================================================================
-- STEP 2: Delete all users from auth.users
-- ============================================================================
--
-- NOTE: This requires Supabase service role access
-- If you get a permission error, you need to:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Manually delete all users, OR
--   3. Run this in the Dashboard SQL Editor (which has elevated privileges)
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count users before deletion
    SELECT COUNT(*) INTO user_count FROM auth.users;

    IF user_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '👥 Step 7/7: Deleting % user(s) from auth.users...', user_count;

        -- Delete all users (this cascades to profiles due to ON DELETE CASCADE)
        DELETE FROM auth.users;

        RAISE NOTICE '✅ Deleted % user(s) successfully', user_count;
    ELSE
        RAISE NOTICE '✅ No users found in auth.users';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Reset sequences (auto-increment counters)
-- ============================================================================
--
-- This ensures new records start from ID 1 again
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Resetting auto-increment sequences...';
END $$;

-- Reset questions ID sequence
ALTER SEQUENCE IF EXISTS public.questions_id_seq RESTART WITH 1;

-- Reset answer_records ID sequence
ALTER SEQUENCE IF EXISTS public.answer_records_record_id_seq RESTART WITH 1;

-- Reset daily_usage ID sequence
ALTER SEQUENCE IF EXISTS public.daily_usage_id_seq RESTART WITH 1;

-- Reset user_limits ID sequence
ALTER SEQUENCE IF EXISTS public.user_limits_id_seq RESTART WITH 1;

-- Reset quiz_usage ID sequence
ALTER SEQUENCE IF EXISTS public.quiz_usage_id_seq RESTART WITH 1;

-- ============================================================================
-- STEP 4: Verification and Summary
-- ============================================================================

DO $$
DECLARE
    profiles_count INTEGER;
    quizzes_count INTEGER;
    questions_count INTEGER;
    sessions_count INTEGER;
    answers_count INTEGER;
    users_count INTEGER;
    daily_usage_count INTEGER;
    user_limits_count INTEGER;
    quiz_usage_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 VERIFICATION: Checking remaining records...';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';

    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    SELECT COUNT(*) INTO quizzes_count FROM public.quizzes;
    SELECT COUNT(*) INTO questions_count FROM public.questions;
    SELECT COUNT(*) INTO sessions_count FROM public.review_sessions;
    SELECT COUNT(*) INTO answers_count FROM public.answer_records;
    SELECT COUNT(*) INTO users_count FROM auth.users;
    SELECT COUNT(*) INTO daily_usage_count FROM public.daily_usage;
    SELECT COUNT(*) INTO user_limits_count FROM public.user_limits;
    SELECT COUNT(*) INTO quiz_usage_count FROM public.quiz_usage;

    RAISE NOTICE '';
    RAISE NOTICE '📋 Remaining records:';
    RAISE NOTICE '   • auth.users:        % records', users_count;
    RAISE NOTICE '   • profiles:          % records', profiles_count;
    RAISE NOTICE '   • quizzes:           % records', quizzes_count;
    RAISE NOTICE '   • questions:         % records', questions_count;
    RAISE NOTICE '   • review_sessions:   % records', sessions_count;
    RAISE NOTICE '   • answer_records:    % records', answers_count;
    RAISE NOTICE '   • daily_usage:       % records', daily_usage_count;
    RAISE NOTICE '   • user_limits:       % records', user_limits_count;
    RAISE NOTICE '   • quiz_usage:        % records', quiz_usage_count;
    RAISE NOTICE '';

    IF users_count = 0 AND profiles_count = 0 AND quizzes_count = 0
       AND questions_count = 0 AND sessions_count = 0 AND answers_count = 0
       AND daily_usage_count = 0 AND user_limits_count = 0 AND quiz_usage_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS! All data has been cleared!';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 What is preserved:';
        RAISE NOTICE '   ✓ Table schemas';
        RAISE NOTICE '   ✓ Row Level Security policies';
        RAISE NOTICE '   ✓ Indexes';
        RAISE NOTICE '   ✓ Functions and triggers';
        RAISE NOTICE '   ✓ Constraints and relationships';
        RAISE NOTICE '';
        RAISE NOTICE '📝 Next steps:';
        RAISE NOTICE '   1. You can now sign up with the same email';
        RAISE NOTICE '   2. Clear browser localStorage if needed:';
        RAISE NOTICE '      • Open DevTools (F12)';
        RAISE NOTICE '      • Application → Local Storage';
        RAISE NOTICE '      • Delete all items';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Some records remain!';
        RAISE NOTICE '   This may indicate:';
        RAISE NOTICE '   • Permission issues with auth.users';
        RAISE NOTICE '   • Foreign key constraints blocking deletion';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Manual cleanup required:';
        RAISE NOTICE '   1. Go to Supabase Dashboard → Authentication → Users';
        RAISE NOTICE '   2. Manually delete remaining users';
        RAISE NOTICE '   3. Re-run this script';
    END IF;

    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

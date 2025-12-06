-- Rate Limiting Override Examples for QuizMe
-- This file contains practical examples for setting user limits and overrides

-- ====================================================================
-- BASIC USER LIMIT OVERRIDES
-- ====================================================================

-- Example 1: Premium User (50 quizzes per day)
-- Replace 'user-uuid-here' with actual user ID from profiles table
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
VALUES ('user-uuid-here', 50, FALSE, 'premium')
ON CONFLICT (user_id)
DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  is_unlimited = EXCLUDED.is_unlimited,
  reason = EXCLUDED.reason,
  granted_at = NOW();

-- Example 2: Staff Member (Unlimited access)
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
VALUES ('staff-uuid-here', 0, TRUE, 'staff')
ON CONFLICT (user_id)
DO UPDATE SET
  is_unlimited = EXCLUDED.is_unlimited,
  reason = EXCLUDED.reason,
  granted_at = NOW();

-- Example 3: Beta Tester (15 quizzes per day)
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
VALUES ('tester-uuid-here', 15, FALSE, 'beta-tester')
ON CONFLICT (user_id)
DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  reason = EXCLUDED.reason,
  granted_at = NOW();

-- Example 4: Temporary Promotion (20 quizzes until end of month)
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason, expires_at)
VALUES ('promo-uuid-here', 20, FALSE, 'holiday-promotion', '2025-01-31 23:59:59')
ON CONFLICT (user_id)
DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  reason = EXCLUDED.reason,
  expires_at = EXCLUDED.expires_at,
  granted_at = NOW();

-- ====================================================================
-- FIND USER IDs BY EMAIL
-- ====================================================================

-- Step 1: Find user ID by email address
-- Replace 'user@example.com' with the actual email
SELECT id, email, full_name, created_at
FROM profiles
WHERE email = 'user@example.com';

-- Step 2: Find multiple users by email pattern
SELECT id, email, full_name, created_at
FROM profiles
WHERE email LIKE '%@company.com'
ORDER BY created_at DESC;

-- ====================================================================
-- BULK OPERATIONS
-- ====================================================================

-- Set multiple premium users at once
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
VALUES
  ((SELECT id FROM profiles WHERE email = 'premium1@example.com'), 50, FALSE, 'premium'),
  ((SELECT id FROM profiles WHERE email = 'premium2@example.com'), 50, FALSE, 'premium'),
  ((SELECT id FROM profiles WHERE email = 'premium3@example.com'), 50, FALSE, 'premium')
ON CONFLICT (user_id)
DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  reason = EXCLUDED.reason,
  granted_at = NOW();

-- Set all company employees to higher limits
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
SELECT id, 25, FALSE, 'company-employee'
FROM profiles
WHERE email LIKE '%@yourcompany.com'
ON CONFLICT (user_id)
DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  reason = EXCLUDED.reason,
  granted_at = NOW();

-- ====================================================================
-- VIEW AND MANAGE EXISTING OVERRIDES
-- ====================================================================

-- View all current user overrides
SELECT
  ul.user_id,
  p.email,
  p.full_name,
  ul.daily_limit,
  ul.is_unlimited,
  ul.reason,
  ul.granted_at,
  ul.expires_at,
  CASE
    WHEN ul.expires_at IS NOT NULL AND ul.expires_at < NOW() THEN 'EXPIRED'
    WHEN ul.is_unlimited THEN 'UNLIMITED'
    ELSE 'ACTIVE'
  END as status
FROM user_limits ul
JOIN profiles p ON ul.user_id = p.id
ORDER BY ul.granted_at DESC;

-- View users with their current effective limits and today's usage
SELECT
  p.email,
  p.full_name,
  COALESCE(ul.daily_limit, 5) as effective_limit,
  ul.is_unlimited,
  ul.reason,
  COALESCE(du.quiz_count, 0) as today_usage,
  CASE
    WHEN ul.is_unlimited THEN -1
    ELSE COALESCE(ul.daily_limit, 5) - COALESCE(du.quiz_count, 0)
  END as remaining_today
FROM profiles p
LEFT JOIN user_limits ul ON ul.user_id = p.id
  AND (ul.expires_at IS NULL OR ul.expires_at > NOW())
LEFT JOIN daily_usage du ON du.user_id = p.id
  AND du.generated_date = CURRENT_DATE
ORDER BY today_usage DESC, effective_limit DESC;

-- ====================================================================
-- REMOVE OVERRIDES
-- ====================================================================

-- Remove override for specific user (revert to default 5/day)
DELETE FROM user_limits WHERE user_id = 'user-uuid-here';

-- Remove all expired overrides
DELETE FROM user_limits WHERE expires_at IS NOT NULL AND expires_at < NOW();

-- Remove all overrides for a specific reason
DELETE FROM user_limits WHERE reason = 'holiday-promotion';

-- ====================================================================
-- USAGE ANALYTICS
-- ====================================================================

-- Most active users in the last 7 days
SELECT
  p.email,
  p.full_name,
  SUM(du.quiz_count) as total_quizzes_7days,
  COUNT(du.generated_date) as active_days,
  ROUND(AVG(du.quiz_count), 2) as avg_per_day
FROM daily_usage du
JOIN profiles p ON du.user_id = p.id
WHERE du.generated_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.email, p.full_name
ORDER BY total_quizzes_7days DESC
LIMIT 10;

-- Users who hit their daily limit yesterday
SELECT
  p.email,
  p.full_name,
  du.quiz_count as quizzes_generated,
  COALESCE(ul.daily_limit, 5) as daily_limit,
  ul.reason as limit_type
FROM daily_usage du
JOIN profiles p ON du.user_id = p.id
LEFT JOIN user_limits ul ON ul.user_id = p.id
WHERE du.generated_date = CURRENT_DATE - 1
  AND du.quiz_count >= COALESCE(ul.daily_limit, 5)
  AND NOT COALESCE(ul.is_unlimited, FALSE)
ORDER BY du.quiz_count DESC;

-- ====================================================================
-- PRACTICAL EXAMPLES FOR COMMON SCENARIOS
-- ====================================================================

-- Scenario 1: Upgrade a user to premium after they hit the limit
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id FROM profiles WHERE email = 'user@example.com';

    IF target_user_id IS NOT NULL THEN
        -- Set premium limits
        INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
        VALUES (target_user_id, 50, FALSE, 'premium')
        ON CONFLICT (user_id)
        DO UPDATE SET
          daily_limit = 50,
          reason = 'premium',
          granted_at = NOW();

        RAISE NOTICE 'User % upgraded to premium (50 quizzes/day)', target_user_id;
    ELSE
        RAISE NOTICE 'User not found with email: user@example.com';
    END IF;
END $$;

-- Scenario 2: Give temporary boost to all users during promotion
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason, expires_at)
SELECT
  id,
  20, -- 20 quizzes during promotion
  FALSE,
  'black-friday-2024',
  '2024-12-01 23:59:59' -- Expires end of November
FROM profiles
WHERE created_at < '2024-11-25' -- Only existing users
ON CONFLICT (user_id)
DO UPDATE SET
  daily_limit = CASE
    WHEN user_limits.is_unlimited THEN user_limits.daily_limit -- Keep unlimited users as-is
    ELSE GREATEST(user_limits.daily_limit, 20) -- Increase limit but don't decrease
  END,
  reason = 'black-friday-2024',
  expires_at = '2024-12-01 23:59:59',
  granted_at = NOW();

-- ====================================================================
-- TESTING AND VALIDATION
-- ====================================================================

-- Test the rate limiting functions
SELECT * FROM can_generate_quiz('user-uuid-here');

-- Manually increment usage (for testing)
SELECT increment_quiz_count('user-uuid-here', CURRENT_DATE);

-- Check if a specific user can generate today
SELECT
  p.email,
  cq.allowed,
  cq.current_usage,
  cq.daily_limit,
  cq.is_unlimited,
  cq.remaining_quizzes
FROM profiles p
CROSS JOIN LATERAL can_generate_quiz(p.id) cq
WHERE p.email = 'test@example.com';

-- ====================================================================
-- CLEANUP AND MAINTENANCE
-- ====================================================================

-- Clean up old usage data (keep last 30 days)
DELETE FROM daily_usage
WHERE generated_date < CURRENT_DATE - INTERVAL '30 days';

-- Find and fix any data inconsistencies
SELECT
  user_id,
  generated_date,
  quiz_count,
  'Quiz count is negative' as issue
FROM daily_usage
WHERE quiz_count < 0
UNION ALL
SELECT
  user_id,
  generated_date,
  quiz_count,
  'Quiz count unusually high (>100)' as issue
FROM daily_usage
WHERE quiz_count > 100;

-- Reset a user's today usage (emergency fix)
-- DELETE FROM daily_usage WHERE user_id = 'user-uuid-here' AND generated_date = CURRENT_DATE;
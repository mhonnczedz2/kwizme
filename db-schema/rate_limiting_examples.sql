-- Rate Limiting Examples for QuizMe
-- Focused examples for checking and updating user rate limits

-- ====================================================================
-- 1. HOW TO GET THE CURRENT RATE OF A USER
-- ====================================================================

-- Find user ID by email address
-- Replace 'user@example.com' with the actual email
SELECT id, email, full_name, created_at
FROM profiles
WHERE email = 'user@example.com';

-- Check user's current rate limit and today's usage
-- Replace 'user-uuid-here' with actual user ID from profiles table
SELECT
  p.email,
  p.full_name,
  COALESCE(ul.daily_limit, 5) as current_daily_limit,
  ul.is_unlimited,
  ul.reason as limit_type,
  COALESCE(du.quiz_count, 0) as today_usage,
  CASE
    WHEN ul.is_unlimited THEN 'Unlimited'
    ELSE (COALESCE(ul.daily_limit, 5) - COALESCE(du.quiz_count, 0))::text
  END as remaining_today
FROM profiles p
LEFT JOIN user_limits ul ON ul.user_id = p.id
  AND (ul.expires_at IS NULL OR ul.expires_at > NOW())
LEFT JOIN daily_usage du ON du.user_id = p.id
  AND du.generated_date = CURRENT_DATE
WHERE p.id = 'user-uuid-here';

-- Check if user can generate more quizzes today using the system function
SELECT * FROM can_generate_quiz('user-uuid-here');

-- ====================================================================
-- 2. HOW TO UPDATE THE RATE OF A USER
-- ====================================================================

-- Set custom daily limit for a user (e.g., 20 quizzes per day)
-- Replace 'user-uuid-here' with actual user ID
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
VALUES ('user-uuid-here', 20, FALSE, 'custom-limit')
ON CONFLICT (user_id)
DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  is_unlimited = EXCLUDED.is_unlimited,
  reason = EXCLUDED.reason,
  granted_at = NOW();

-- Set unlimited access for a user (e.g., staff member)
-- Replace 'user-uuid-here' with actual user ID
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
VALUES ('user-uuid-here', 0, TRUE, 'staff')
ON CONFLICT (user_id)
DO UPDATE SET
  is_unlimited = EXCLUDED.is_unlimited,
  reason = EXCLUDED.reason,
  granted_at = NOW();

-- Remove custom limit (revert user back to default 5 quizzes per day)
-- Replace 'user-uuid-here' with actual user ID
DELETE FROM user_limits WHERE user_id = 'user-uuid-here';

-- Update rate limit by email (find user ID automatically)
-- Replace 'user@example.com' with actual email
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
VALUES (
  (SELECT id FROM profiles WHERE email = 'user@example.com'),
  25,
  FALSE,
  'premium'
)
ON CONFLICT (user_id)
DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  is_unlimited = EXCLUDED.is_unlimited,
  reason = EXCLUDED.reason,
  granted_at = NOW();
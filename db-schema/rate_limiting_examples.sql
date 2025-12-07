-- Rate Limiting Examples for QuizMe
-- Single-query examples using only email address as input

-- ====================================================================
-- 1. GET USER RATE LIMIT INFO (Easy Input Version)
-- ====================================================================

-- 📊 COMPLETE USER RATE STATUS
-- Just change this one value and run:
-- ✏️  EMAIL: 'user@example.com'
WITH inputs AS (
  SELECT 'user@example.com'::text as email  -- 📝 CHANGE THIS: User's email
)
SELECT
  p.id,
  p.email,
  p.full_name,
  COALESCE(ul.daily_limit, 5) as current_daily_limit,
  ul.is_unlimited,
  ul.reason as limit_type,
  COALESCE(du.quiz_count, 0) as today_usage,
  CASE
    WHEN ul.is_unlimited THEN 'Unlimited'
    ELSE (COALESCE(ul.daily_limit, 5) - COALESCE(du.quiz_count, 0))::text
  END as remaining_today,
  CASE
    WHEN ul.is_unlimited THEN true
    ELSE (COALESCE(ul.daily_limit, 5) - COALESCE(du.quiz_count, 0)) > 0
  END as can_generate_more
FROM profiles p
CROSS JOIN inputs i
LEFT JOIN user_limits ul ON ul.user_id = p.id
  AND (ul.expires_at IS NULL OR ul.expires_at > NOW())
LEFT JOIN daily_usage du ON du.user_id = p.id
  AND du.generated_date = CURRENT_DATE
WHERE p.email = i.email;

-- ====================================================================
-- 2. UPDATE USER RATE LIMITS (Easy Input Version)
-- ====================================================================

-- 🎯 UNIVERSAL RATE LIMIT UPDATER
-- Just change these two values and run:
-- ✏️  EMAIL: 'user@example.com'
-- ✏️  LIMIT: 25 (use -1 for unlimited)
WITH inputs AS (
  SELECT
    'user@example.com'::text as email,  -- 📝 CHANGE THIS: User's email
    25 as new_limit                     -- 📝 CHANGE THIS: New limit (-1 = unlimited)
)
INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason)
SELECT
  p.id,
  CASE WHEN i.new_limit = -1 THEN 0 ELSE i.new_limit END,
  CASE WHEN i.new_limit = -1 THEN TRUE ELSE FALSE END,
  CASE
    WHEN i.new_limit = -1 THEN 'unlimited'
    WHEN i.new_limit > 50 THEN 'premium'
    WHEN i.new_limit > 10 THEN 'custom-limit'
    ELSE 'basic'
  END
FROM profiles p
CROSS JOIN inputs i
WHERE p.email = i.email
ON CONFLICT (user_id)
DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  is_unlimited = EXCLUDED.is_unlimited,
  reason = EXCLUDED.reason,
  granted_at = NOW();

-- 🗑️ REMOVE USER LIMIT (back to default 5)
-- Just change the email and run:
-- ✏️  EMAIL: 'user@example.com'
DELETE FROM user_limits
WHERE user_id = (
  SELECT id FROM profiles
  WHERE email = 'user@example.com'  -- 📝 CHANGE THIS: User's email
);

-- ====================================================================
-- 3. PRESET LIMIT EXAMPLES (Copy & Paste Ready)
-- ====================================================================

-- 🔥 Set UNLIMITED access (staff/admin)
WITH inputs AS (SELECT 'user@example.com'::text as email) INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason) SELECT p.id, 0, TRUE, 'staff' FROM profiles p CROSS JOIN inputs i WHERE p.email = i.email ON CONFLICT (user_id) DO UPDATE SET daily_limit = EXCLUDED.daily_limit, is_unlimited = EXCLUDED.is_unlimited, reason = EXCLUDED.reason, granted_at = NOW();

-- 💎 Set PREMIUM limit (50 per day)
WITH inputs AS (SELECT 'user@example.com'::text as email) INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason) SELECT p.id, 50, FALSE, 'premium' FROM profiles p CROSS JOIN inputs i WHERE p.email = i.email ON CONFLICT (user_id) DO UPDATE SET daily_limit = EXCLUDED.daily_limit, is_unlimited = EXCLUDED.is_unlimited, reason = EXCLUDED.reason, granted_at = NOW();

-- 🎓 Set STUDENT limit (15 per day)
WITH inputs AS (SELECT 'user@example.com'::text as email) INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason) SELECT p.id, 15, FALSE, 'student' FROM profiles p CROSS JOIN inputs i WHERE p.email = i.email ON CONFLICT (user_id) DO UPDATE SET daily_limit = EXCLUDED.daily_limit, is_unlimited = EXCLUDED.is_unlimited, reason = EXCLUDED.reason, granted_at = NOW();

-- 🧪 Set TESTER limit (100 per day)
WITH inputs AS (SELECT 'user@example.com'::text as email) INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason) SELECT p.id, 100, FALSE, 'tester' FROM profiles p CROSS JOIN inputs i WHERE p.email = i.email ON CONFLICT (user_id) DO UPDATE SET daily_limit = EXCLUDED.daily_limit, is_unlimited = EXCLUDED.is_unlimited, reason = EXCLUDED.reason, granted_at = NOW();

-- 🗑️ REMOVE limit (back to default 5)
DELETE FROM user_limits WHERE user_id = (SELECT id FROM profiles WHERE email = 'user@example.com');

-- ====================================================================
-- 4. ONE-LINER COPY-PASTE EXAMPLES
-- ====================================================================

-- 📊 Get user status (just change email in the inputs section):
-- WITH inputs AS (SELECT 'user@example.com'::text as email) SELECT p.id, p.email, p.full_name, COALESCE(ul.daily_limit, 5) as current_daily_limit, ul.is_unlimited, ul.reason as limit_type, COALESCE(du.quiz_count, 0) as today_usage, CASE WHEN ul.is_unlimited THEN 'Unlimited' ELSE (COALESCE(ul.daily_limit, 5) - COALESCE(du.quiz_count, 0))::text END as remaining_today, CASE WHEN ul.is_unlimited THEN true ELSE (COALESCE(ul.daily_limit, 5) - COALESCE(du.quiz_count, 0)) > 0 END as can_generate_more FROM profiles p CROSS JOIN inputs i LEFT JOIN user_limits ul ON ul.user_id = p.id AND (ul.expires_at IS NULL OR ul.expires_at > NOW()) LEFT JOIN daily_usage du ON du.user_id = p.id AND du.generated_date = CURRENT_DATE WHERE p.email = i.email;

-- 🎯 Universal updater (change email and limit in the inputs section):
-- WITH inputs AS (SELECT 'user@example.com'::text as email, 25 as new_limit) INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason) SELECT p.id, CASE WHEN i.new_limit = -1 THEN 0 ELSE i.new_limit END, CASE WHEN i.new_limit = -1 THEN TRUE ELSE FALSE END, CASE WHEN i.new_limit = -1 THEN 'unlimited' WHEN i.new_limit > 50 THEN 'premium' WHEN i.new_limit > 10 THEN 'custom-limit' ELSE 'basic' END FROM profiles p CROSS JOIN inputs i WHERE p.email = i.email ON CONFLICT (user_id) DO UPDATE SET daily_limit = EXCLUDED.daily_limit, is_unlimited = EXCLUDED.is_unlimited, reason = EXCLUDED.reason, granted_at = NOW();
-- Rate Limiting System for KwizMe
-- This adds daily quiz generation limits with user overrides

-- 1. Track daily quiz generation attempts
CREATE TABLE daily_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  ip_address INET, -- For anonymous users (optional)
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quiz_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one record per user per day
  UNIQUE(user_id, generated_date)
);

-- 2. User override settings (premium users, staff, etc.)
CREATE TABLE user_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) UNIQUE,
  daily_limit INTEGER NOT NULL DEFAULT 5,
  is_unlimited BOOLEAN DEFAULT FALSE,
  reason TEXT, -- 'premium', 'staff', 'tester', 'custom', etc.
  granted_by UUID REFERENCES profiles(id), -- Who granted the override
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CHECK (daily_limit > 0 OR is_unlimited = TRUE),
  CHECK (reason IS NOT NULL)
);

-- 3. Indexes for performance
CREATE INDEX idx_daily_usage_user_date ON daily_usage(user_id, generated_date);
CREATE INDEX idx_daily_usage_ip_date ON daily_usage(ip_address, generated_date);
CREATE INDEX idx_user_limits_user_id ON user_limits(user_id);
CREATE INDEX idx_user_limits_expires ON user_limits(expires_at) WHERE expires_at IS NOT NULL;

-- 4. Enable Row Level Security
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Users can only see their own usage data
CREATE POLICY "Users can view own usage" ON daily_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage" ON daily_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own usage" ON daily_usage
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only see their own limits
CREATE POLICY "Users can view own limits" ON user_limits
  FOR SELECT USING (user_id = auth.uid());

-- Only service role can modify user limits (admin operations)
CREATE POLICY "Service role can manage limits" ON user_limits
  FOR ALL USING (auth.role() = 'service_role');

-- 6. SQL Functions

-- Function to safely increment quiz count
CREATE OR REPLACE FUNCTION increment_quiz_count(p_user_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  -- Try to update existing record
  UPDATE daily_usage
  SET
    quiz_count = quiz_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND generated_date = p_date;

  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO daily_usage (user_id, generated_date, quiz_count)
    VALUES (p_user_id, p_date, 1)
    ON CONFLICT (user_id, generated_date)
    DO UPDATE SET
      quiz_count = daily_usage.quiz_count + 1,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's effective daily limit
CREATE OR REPLACE FUNCTION get_user_daily_limit(p_user_id UUID)
RETURNS TABLE(
  daily_limit INTEGER,
  is_unlimited BOOLEAN,
  limit_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ul.daily_limit, 5) as daily_limit,
    COALESCE(ul.is_unlimited, FALSE) as is_unlimited,
    COALESCE(ul.reason, 'default') as limit_type
  FROM profiles p
  LEFT JOIN user_limits ul ON ul.user_id = p.id
    AND (ul.expires_at IS NULL OR ul.expires_at > NOW())
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can generate quiz today
CREATE OR REPLACE FUNCTION can_generate_quiz(p_user_id UUID)
RETURNS TABLE(
  allowed BOOLEAN,
  current_usage INTEGER,
  daily_limit INTEGER,
  is_unlimited BOOLEAN,
  remaining_quizzes INTEGER
) AS $$
DECLARE
  v_usage INTEGER := 0;
  v_limit INTEGER := 5;
  v_unlimited BOOLEAN := FALSE;
BEGIN
  -- Get user's limit
  SELECT ul.daily_limit, ul.is_unlimited
  INTO v_limit, v_unlimited
  FROM user_limits ul
  WHERE ul.user_id = p_user_id
    AND (ul.expires_at IS NULL OR ul.expires_at > NOW());

  -- If no custom limit found, use default
  v_limit := COALESCE(v_limit, 5);
  v_unlimited := COALESCE(v_unlimited, FALSE);

  -- Get today's usage
  SELECT COALESCE(du.quiz_count, 0)
  INTO v_usage
  FROM daily_usage du
  WHERE du.user_id = p_user_id
    AND du.generated_date = CURRENT_DATE;

  v_usage := COALESCE(v_usage, 0);

  -- Return results
  RETURN QUERY
  SELECT
    v_unlimited OR v_usage < v_limit as allowed,
    v_usage as current_usage,
    v_limit as daily_limit,
    v_unlimited as is_unlimited,
    CASE
      WHEN v_unlimited THEN -1
      ELSE GREATEST(0, v_limit - v_usage)
    END as remaining_quizzes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION increment_quiz_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_daily_limit TO authenticated;
GRANT EXECUTE ON FUNCTION can_generate_quiz TO authenticated;

-- 8. Create some sample data (optional - for testing)
-- Uncomment these lines if you want sample data

-- INSERT INTO user_limits (user_id, daily_limit, is_unlimited, reason) VALUES
-- -- Premium user with 50 quizzes per day
-- ('00000000-0000-0000-0000-000000000001', 50, FALSE, 'premium'),
-- -- Staff member with unlimited access
-- ('00000000-0000-0000-0000-000000000002', 0, TRUE, 'staff'),
-- -- Tester with higher limit
-- ('00000000-0000-0000-0000-000000000003', 20, FALSE, 'tester');

-- 9. Comments for documentation
COMMENT ON TABLE daily_usage IS 'Tracks daily quiz generation usage per user';
COMMENT ON TABLE user_limits IS 'Defines custom daily limits for specific users';
COMMENT ON FUNCTION increment_quiz_count IS 'Safely increments quiz generation count for a user on a specific date';
COMMENT ON FUNCTION can_generate_quiz IS 'Checks if a user can generate another quiz today based on their limits';
COMMENT ON FUNCTION get_user_daily_limit IS 'Gets effective daily limit for a user (custom or default)';
-- Fixed increment function without race conditions
-- This replaces the existing increment_quiz_count function

-- Function to safely increment quiz count (fixed version)
CREATE OR REPLACE FUNCTION increment_quiz_count(p_user_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  -- Single upsert operation to avoid race conditions
  INSERT INTO daily_usage (user_id, generated_date, quiz_count, created_at, updated_at)
  VALUES (p_user_id, p_date, 1, NOW(), NOW())
  ON CONFLICT (user_id, generated_date)
  DO UPDATE SET
    quiz_count = daily_usage.quiz_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION increment_quiz_count TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION increment_quiz_count IS 'Safely increments quiz generation count for a user on a specific date (race-condition free)';
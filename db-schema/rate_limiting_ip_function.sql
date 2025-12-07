-- IP-based rate limiting function for anonymous users
-- This adds support for tracking anonymous users by IP address

-- Function to safely increment quiz count for IP addresses
CREATE OR REPLACE FUNCTION increment_quiz_count_ip(p_ip_address INET, p_date DATE)
RETURNS void AS $$
BEGIN
  -- Insert or update usage record for IP address
  INSERT INTO daily_usage (ip_address, generated_date, quiz_count, created_at, updated_at)
  VALUES (p_ip_address, p_date, 1, NOW(), NOW())
  ON CONFLICT (ip_address, generated_date)
  DO UPDATE SET
    quiz_count = daily_usage.quiz_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to use this function
GRANT EXECUTE ON FUNCTION increment_quiz_count_ip TO authenticated;
GRANT EXECUTE ON FUNCTION increment_quiz_count_ip TO anon;

-- Add unique constraint for IP address + date (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'daily_usage_ip_date_unique'
  ) THEN
    ALTER TABLE daily_usage
    ADD CONSTRAINT daily_usage_ip_date_unique
    UNIQUE (ip_address, generated_date);
  END IF;
END $$;

-- Update RLS policies to allow anonymous IP-based access
CREATE POLICY "Anonymous users can insert IP usage" ON daily_usage
  FOR INSERT WITH CHECK (ip_address IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Anonymous users can view IP usage" ON daily_usage
  FOR SELECT USING (ip_address IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Anonymous users can update IP usage" ON daily_usage
  FOR UPDATE USING (ip_address IS NOT NULL AND user_id IS NULL);

-- Add comment for documentation
COMMENT ON FUNCTION increment_quiz_count_ip IS 'Safely increments quiz generation count for an IP address on a specific date';
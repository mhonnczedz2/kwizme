-- New Rate Limiting Schema for KwizMe
-- Uses timestamp-based tracking instead of date-based

-- Drop old tables if migrating (be careful in production!)
-- DROP TABLE IF EXISTS daily_usage;

-- Simple quiz usage log table
-- Each row = one quiz generation
CREATE TABLE quiz_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  ip_address INET, -- For anonymous users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Either user_id or ip_address must be set
  CONSTRAINT user_or_ip CHECK (user_id IS NOT NULL OR ip_address IS NOT NULL)
);

-- Indexes for efficient queries
CREATE INDEX idx_quiz_usage_user_created ON quiz_usage(user_id, created_at DESC);
CREATE INDEX idx_quiz_usage_ip_created ON quiz_usage(ip_address, created_at DESC);
CREATE INDEX idx_quiz_usage_created ON quiz_usage(created_at DESC);

-- Enable Row Level Security
ALTER TABLE quiz_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage" ON quiz_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage" ON quiz_usage
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Service role can do anything (for admin operations)
CREATE POLICY "Service role full access" ON quiz_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Anonymous users can insert/view IP-based usage
CREATE POLICY "Anonymous can insert IP usage" ON quiz_usage
  FOR INSERT WITH CHECK (ip_address IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Anonymous can view IP usage" ON quiz_usage
  FOR SELECT USING (ip_address IS NOT NULL AND user_id IS NULL);

-- Optional: Auto-cleanup old records (older than 30 days)
-- Run this periodically via a cron job or Supabase Edge Function
-- DELETE FROM quiz_usage WHERE created_at < NOW() - INTERVAL '30 days';

-- Comments for documentation
COMMENT ON TABLE quiz_usage IS 'Logs each quiz generation with timestamp for rate limiting';
COMMENT ON COLUMN quiz_usage.user_id IS 'User ID for authenticated users';
COMMENT ON COLUMN quiz_usage.ip_address IS 'IP address for anonymous users';
COMMENT ON COLUMN quiz_usage.created_at IS 'When the quiz was generated - used for period calculations';

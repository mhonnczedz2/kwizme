-- SQL function to safely increment quiz count
CREATE OR REPLACE FUNCTION increment_quiz_count(p_user_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_quiz_count TO authenticated;
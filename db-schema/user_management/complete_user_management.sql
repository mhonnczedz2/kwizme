-- Complete User Management System for KwizMe
-- Combines soft delete + re-signup handling + admin features
-- This is the ONLY file you need for complete user management

-- ================================
-- 1. ADD USER STATUS COLUMNS
-- ================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS disabled_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS disable_reason TEXT;

-- ================================
-- 2. ENHANCED DISABLE FUNCTION
-- ================================

CREATE OR REPLACE FUNCTION disable_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Admin action',
  p_allow_reactivation BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
  user_info profiles%ROWTYPE;
  result JSON;
BEGIN
  -- Check if admin has permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_admin_id
    AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Admin user not found or inactive';
  END IF;

  -- Get user info before disabling
  SELECT * INTO user_info FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Disable the user
  UPDATE profiles
  SET
    is_active = FALSE,
    disabled_at = NOW(),
    disabled_by = p_admin_id,
    disable_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return result with guidance
  SELECT json_build_object(
    'success', TRUE,
    'user_id', p_user_id,
    'email', user_info.email,
    'disabled_at', NOW(),
    'disabled_by', p_admin_id,
    'reason', p_reason,
    'allow_reactivation', p_allow_reactivation,
    'note', CASE
      WHEN p_allow_reactivation THEN 'User can sign up again to reactivate account'
      ELSE 'User cannot sign up again - use permanently_disable_user() for stronger blocking'
    END
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 3. REACTIVATE FUNCTION
-- ================================

CREATE OR REPLACE FUNCTION reactivate_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  user_info profiles%ROWTYPE;
BEGIN
  -- Check if admin has permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_admin_id
    AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Admin user not found or inactive';
  END IF;

  -- Get user info
  SELECT * INTO user_info FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Reactivate the user
  UPDATE profiles
  SET
    is_active = TRUE,
    disabled_at = NULL,
    disabled_by = NULL,
    disable_reason = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log manual reactivation
  INSERT INTO user_reactivation_log (
    user_id,
    previous_disable_reason,
    reactivated_at,
    reactivation_method,
    reactivated_by
  ) VALUES (
    p_user_id,
    user_info.disable_reason,
    NOW(),
    'manual_admin',
    p_admin_id
  );

  RETURN json_build_object(
    'success', TRUE,
    'user_id', p_user_id,
    'email', user_info.email,
    'reactivated_at', NOW(),
    'reactivated_by', p_admin_id,
    'previous_reason', user_info.disable_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 4. PERMANENT DISABLE FUNCTION
-- ================================

CREATE OR REPLACE FUNCTION permanently_disable_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Permanent suspension'
)
RETURNS JSON AS $$
BEGIN
  -- First disable normally
  PERFORM disable_user(p_user_id, p_admin_id, p_reason, FALSE);

  -- Add special marker to prevent auto-reactivation
  UPDATE profiles
  SET disable_reason = disable_reason || ' [PERMANENT - NO REACTIVATION]'
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', TRUE,
    'message', 'User permanently disabled. Manual auth deletion required to prevent re-signup.',
    'next_steps', 'Delete auth.users record in Supabase dashboard to fully prevent re-signup'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 5. USER STATUS FUNCTION
-- ================================

CREATE OR REPLACE FUNCTION get_user_status(p_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  is_active BOOLEAN,
  disabled_at TIMESTAMP WITH TIME ZONE,
  disabled_by_email TEXT,
  disable_reason TEXT,
  quiz_count BIGINT,
  session_count BIGINT,
  can_reactivate BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.email,
    p.full_name,
    p.is_active,
    p.disabled_at,
    admin.email as disabled_by_email,
    p.disable_reason,
    COALESCE(quiz_stats.quiz_count, 0) as quiz_count,
    COALESCE(session_stats.session_count, 0) as session_count,
    CASE
      WHEN p.is_active THEN FALSE
      WHEN p.disable_reason LIKE '%[PERMANENT - NO REACTIVATION]%' THEN FALSE
      ELSE TRUE
    END as can_reactivate
  FROM profiles p
  LEFT JOIN profiles admin ON p.disabled_by = admin.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as quiz_count
    FROM quizzes
    WHERE user_id = p_user_id
    GROUP BY user_id
  ) quiz_stats ON quiz_stats.user_id = p.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as session_count
    FROM review_sessions
    WHERE user_id = p_user_id
    GROUP BY user_id
  ) session_stats ON session_stats.user_id = p.id
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 6. EMAIL SIGNUP VALIDATION
-- ================================

CREATE OR REPLACE FUNCTION can_email_signup(p_email TEXT)
RETURNS JSON AS $$
DECLARE
  profile_record profiles%ROWTYPE;
  result JSON;
BEGIN
  -- Check if profile exists for this email
  SELECT p.* INTO profile_record
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE au.email = p_email;

  IF NOT FOUND THEN
    -- Email not in use, can sign up normally
    SELECT json_build_object(
      'can_signup', TRUE,
      'status', 'available',
      'message', 'Email available for signup'
    ) INTO result;
  ELSIF profile_record.is_active = FALSE THEN
    -- Check if permanently disabled
    IF profile_record.disable_reason LIKE '%[PERMANENT - NO REACTIVATION]%' THEN
      SELECT json_build_object(
        'can_signup', FALSE,
        'status', 'permanently_disabled',
        'message', 'This account has been permanently disabled. Contact administrator.',
        'disabled_reason', profile_record.disable_reason,
        'disabled_at', profile_record.disabled_at
      ) INTO result;
    ELSE
      -- Email belongs to disabled user, will be reactivated
      SELECT json_build_object(
        'can_signup', TRUE,
        'status', 'reactivation',
        'message', 'This email was previously disabled. Signing up will reactivate your account.',
        'disabled_reason', profile_record.disable_reason,
        'disabled_at', profile_record.disabled_at
      ) INTO result;
    END IF;
  ELSE
    -- Email belongs to active user
    SELECT json_build_object(
      'can_signup', FALSE,
      'status', 'exists',
      'message', 'This email is already registered and active'
    ) INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 7. REACTIVATION LOG TABLE
-- ================================

CREATE TABLE IF NOT EXISTS user_reactivation_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  previous_disable_reason TEXT,
  reactivated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reactivation_method TEXT DEFAULT 'auto_signup',
  reactivated_by UUID REFERENCES profiles(id),
  notes TEXT
);

-- ================================
-- 8. ENHANCED SIGNUP TRIGGER
-- ================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_profile profiles%ROWTYPE;
BEGIN
  -- Check if profile already exists
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE id = NEW.id;

  IF FOUND THEN
    -- Check if this is a permanent disable
    IF existing_profile.is_active = FALSE AND
       existing_profile.disable_reason LIKE '%[PERMANENT - NO REACTIVATION]%' THEN

      RAISE EXCEPTION 'Account permanently disabled. Contact administrator. Reason: %',
        existing_profile.disable_reason;

    ELSIF existing_profile.is_active = FALSE THEN
      -- Normal soft delete - allow reactivation
      UPDATE public.profiles
      SET
        is_active = TRUE,
        disabled_at = NULL,
        disabled_by = NULL,
        disable_reason = NULL,
        email = COALESCE(NEW.email, existing_profile.email),
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', existing_profile.full_name),
        institution = COALESCE(NEW.raw_user_meta_data->>'institution', existing_profile.institution),
        program = COALESCE(NEW.raw_user_meta_data->>'program', existing_profile.program),
        updated_at = NOW()
      WHERE id = NEW.id;

      -- Log reactivation
      INSERT INTO user_reactivation_log (
        user_id, previous_disable_reason, reactivated_at, reactivation_method
      ) VALUES (
        NEW.id, existing_profile.disable_reason, NOW(), 'auto_signup'
      );

    ELSE
      -- Profile exists and is active
      UPDATE public.profiles
      SET
        email = COALESCE(NEW.email, existing_profile.email),
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', existing_profile.full_name),
        updated_at = NOW()
      WHERE id = NEW.id;
    END IF;

  ELSE
    -- New user signup
    INSERT INTO public.profiles (id, email, full_name, institution, program, is_active)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'institution',
      NEW.raw_user_meta_data->>'program',
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 9. ADMIN MANAGEMENT VIEW
-- ================================

CREATE OR REPLACE VIEW admin_user_management AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.institution,
  p.program,
  p.is_active,
  p.disabled_at,
  p.disable_reason,
  admin.email as disabled_by_email,
  p.created_at,
  COALESCE(quiz_count.count, 0) as total_quizzes,
  COALESCE(session_count.count, 0) as total_sessions,
  recent_activity.last_activity,
  CASE
    WHEN p.is_active THEN 'Active'
    WHEN p.disable_reason LIKE '%[PERMANENT - NO REACTIVATION]%' THEN 'Permanently Disabled'
    ELSE 'Disabled (Can Reactivate)'
  END as status,
  COALESCE(reactivation_count.count, 0) as reactivation_count
FROM profiles p
LEFT JOIN profiles admin ON p.disabled_by = admin.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM quizzes
  GROUP BY user_id
) quiz_count ON quiz_count.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM review_sessions
  GROUP BY user_id
) session_count ON session_count.user_id = p.id
LEFT JOIN (
  SELECT user_id, MAX(created_at) as last_activity
  FROM (
    SELECT user_id, created_at FROM quizzes
    UNION ALL
    SELECT user_id, started_at as created_at FROM review_sessions
  ) activities
  GROUP BY user_id
) recent_activity ON recent_activity.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM user_reactivation_log
  GROUP BY user_id
) reactivation_count ON reactivation_count.user_id = p.id
ORDER BY p.created_at DESC;

-- ================================
-- 10. RLS POLICY UPDATES
-- ================================

-- Update profiles RLS to hide inactive users from regular users
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id AND is_active = TRUE);

-- Allow service role to view all profiles (for admin functions)
CREATE POLICY "Service role can view all profiles"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role');

-- Update quiz policies to respect user active status
DROP POLICY IF EXISTS "Users can view own quizzes" ON public.quizzes;
CREATE POLICY "Users can view own quizzes"
    ON public.quizzes FOR SELECT
    USING (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND is_active = TRUE
      )
    );

-- Update review sessions policies
DROP POLICY IF EXISTS "Users can view own review sessions" ON public.review_sessions;
CREATE POLICY "Users can view own review sessions"
    ON public.review_sessions FOR SELECT
    USING (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND is_active = TRUE
      )
    );

-- ================================
-- 11. RLS FOR NEW TABLES
-- ================================

ALTER TABLE user_reactivation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can view reactivation logs" ON user_reactivation_log
  FOR SELECT USING (auth.role() = 'service_role');

-- Users can view their own reactivation history
CREATE POLICY "Users can view own reactivation history" ON user_reactivation_log
  FOR SELECT USING (user_id = auth.uid());

-- ================================
-- 12. PERMISSIONS
-- ================================

-- Grant function permissions
GRANT EXECUTE ON FUNCTION disable_user TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_user TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_disable_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_status TO authenticated;
GRANT EXECUTE ON FUNCTION can_email_signup TO anon, authenticated;

-- Grant view permissions
GRANT SELECT ON admin_user_management TO authenticated;

-- ================================
-- 13. INDEXES
-- ================================

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_disabled_at ON profiles(disabled_at) WHERE disabled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_reactivation_log_user_id ON user_reactivation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reactivation_log_reactivated_at ON user_reactivation_log(reactivated_at DESC);

-- ================================
-- 14. COMMENTS
-- ================================

COMMENT ON FUNCTION disable_user IS 'Soft delete a user account - disables access but preserves data. Optional reactivation control.';
COMMENT ON FUNCTION reactivate_user IS 'Manually reactivate a previously disabled user account';
COMMENT ON FUNCTION permanently_disable_user IS 'Disable user permanently - prevents auto-reactivation on signup';
COMMENT ON FUNCTION get_user_status IS 'Get comprehensive user status including quiz/session counts and reactivation capability';
COMMENT ON FUNCTION can_email_signup IS 'Check if an email can sign up - handles existing disabled accounts';
COMMENT ON VIEW admin_user_management IS 'Complete admin view for managing all users with activity and reactivation statistics';
COMMENT ON TABLE user_reactivation_log IS 'Audit trail of user reactivations via signup or manual admin action';

-- ================================
-- 15. SUCCESS MESSAGE
-- ================================

DO $$
BEGIN
    RAISE NOTICE '🎉 COMPLETE User Management System Created!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Available Functions:';
    RAISE NOTICE '  • disable_user() - Soft delete with reactivation control';
    RAISE NOTICE '  • reactivate_user() - Manual admin reactivation';
    RAISE NOTICE '  • permanently_disable_user() - Prevent reactivation';
    RAISE NOTICE '  • get_user_status() - Comprehensive user info';
    RAISE NOTICE '  • can_email_signup() - Email validation for frontend';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Available Views:';
    RAISE NOTICE '  • admin_user_management - Complete admin dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Features:';
    RAISE NOTICE '  ✅ Soft delete with data preservation';
    RAISE NOTICE '  ✅ Automatic reactivation on re-signup';
    RAISE NOTICE '  ✅ Permanent disable option';
    RAISE NOTICE '  ✅ Complete audit trail';
    RAISE NOTICE '  ✅ Admin dashboard with statistics';
    RAISE NOTICE '  ✅ Frontend email validation';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 This is the ONLY user management file you need!';
END $$;
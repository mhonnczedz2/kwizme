-- Fix QuizMe Schema Issues
-- Run this to add missing columns to profiles table
-- Based on verification results

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS program TEXT;

-- Verify the fix
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('institution', 'program');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Profiles table updated successfully!';
    RAISE NOTICE 'Added columns: institution, program';
END $$;

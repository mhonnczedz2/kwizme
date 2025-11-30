-- Fix quiz_id data type mismatch
-- This script fixes an existing quizzes table that might have UUID type for quiz_id
-- Run this BEFORE the complete schema if you have an existing table

-- Option 1: If you have an existing quizzes table with data you want to keep
-- Drop the existing table and recreate with correct schema
-- WARNING: This will delete all existing quiz data

-- First, disable RLS temporarily
ALTER TABLE IF EXISTS public.quizzes DISABLE ROW LEVEL SECURITY;

-- Drop dependent tables first (due to foreign keys)
DROP TABLE IF EXISTS public.answer_records CASCADE;
DROP TABLE IF EXISTS public.review_sessions CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;

-- Now run the complete schema from supabase_complete_schema.sql
-- This ensures all tables are created with the correct data types

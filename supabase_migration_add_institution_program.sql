-- Migration: Add institution and program to profiles table
-- Run this in Supabase SQL Editor

-- Add institution and program columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS program TEXT;

-- Update the handle_new_user function to include institution and program
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, institution, program)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'institution',
        NEW.raw_user_meta_data->>'program'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- No need to recreate the trigger, it uses the updated function automatically

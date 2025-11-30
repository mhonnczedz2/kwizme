-- Complete Supabase Schema for QuizMe
-- Run this in Supabase SQL Editor to create all required tables
-- Make sure to run this as a single transaction

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    institution TEXT,
    program TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create quizzes table
-- Note: Using TEXT for quiz_id to match application's string-based ID format
CREATE TABLE IF NOT EXISTS public.quizzes (
    quiz_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    description TEXT,
    institution TEXT,
    program TEXT,
    course TEXT,
    course_code TEXT,
    topic TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
DROP POLICY IF EXISTS "Users can view own quizzes" ON public.quizzes;
CREATE POLICY "Users can view own quizzes"
    ON public.quizzes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quizzes" ON public.quizzes;
CREATE POLICY "Users can insert own quizzes"
    ON public.quizzes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quizzes" ON public.quizzes;
CREATE POLICY "Users can update own quizzes"
    ON public.quizzes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own quizzes" ON public.quizzes;
CREATE POLICY "Users can delete own quizzes"
    ON public.quizzes FOR DELETE
    USING (auth.uid() = user_id);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id BIGSERIAL PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(quiz_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    correct_answer_index INTEGER,
    explanation TEXT,
    citation TEXT,
    hint TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions (inherit from quizzes)
DROP POLICY IF EXISTS "Users can view questions from own quizzes" ON public.questions;
CREATE POLICY "Users can view questions from own quizzes"
    ON public.questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.quiz_id = questions.quiz_id
            AND quizzes.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert questions to own quizzes" ON public.questions;
CREATE POLICY "Users can insert questions to own quizzes"
    ON public.questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.quiz_id = questions.quiz_id
            AND quizzes.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update questions in own quizzes" ON public.questions;
CREATE POLICY "Users can update questions in own quizzes"
    ON public.questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.quiz_id = questions.quiz_id
            AND quizzes.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete questions from own quizzes" ON public.questions;
CREATE POLICY "Users can delete questions from own quizzes"
    ON public.questions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.quiz_id = questions.quiz_id
            AND quizzes.user_id = auth.uid()
        )
    );

-- Create review_sessions table
CREATE TABLE IF NOT EXISTS public.review_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(quiz_id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER,
    score_percentage REAL,
    time_spent_seconds INTEGER,
    quick_submit BOOLEAN DEFAULT FALSE,
    show_explanation BOOLEAN DEFAULT TRUE,
    time_limit_seconds INTEGER,
    randomize_options BOOLEAN DEFAULT FALSE,
    randomize_questions BOOLEAN DEFAULT FALSE,
    num_questions_selected INTEGER NOT NULL,
    preset_name TEXT
);

-- Enable Row Level Security for review_sessions
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_sessions
DROP POLICY IF EXISTS "Users can view own review sessions" ON public.review_sessions;
CREATE POLICY "Users can view own review sessions"
    ON public.review_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own review sessions" ON public.review_sessions;
CREATE POLICY "Users can insert own review sessions"
    ON public.review_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own review sessions" ON public.review_sessions;
CREATE POLICY "Users can update own review sessions"
    ON public.review_sessions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own review sessions" ON public.review_sessions;
CREATE POLICY "Users can delete own review sessions"
    ON public.review_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Create answer_records table
CREATE TABLE IF NOT EXISTS public.answer_records (
    record_id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.review_sessions(session_id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_answer_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for answer_records
ALTER TABLE public.answer_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for answer_records (inherit from review_sessions)
DROP POLICY IF EXISTS "Users can view own answer records" ON public.answer_records;
CREATE POLICY "Users can view own answer records"
    ON public.answer_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.review_sessions
            WHERE review_sessions.session_id = answer_records.session_id
            AND review_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own answer records" ON public.answer_records;
CREATE POLICY "Users can insert own answer records"
    ON public.answer_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.review_sessions
            WHERE review_sessions.session_id = answer_records.session_id
            AND review_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own answer records" ON public.answer_records;
CREATE POLICY "Users can update own answer records"
    ON public.answer_records FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.review_sessions
            WHERE review_sessions.session_id = answer_records.session_id
            AND review_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own answer records" ON public.answer_records;
CREATE POLICY "Users can delete own answer records"
    ON public.answer_records FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.review_sessions
            WHERE review_sessions.session_id = answer_records.session_id
            AND review_sessions.user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_institution ON public.quizzes(institution);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_code ON public.quizzes(course_code);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);

CREATE INDEX IF NOT EXISTS idx_review_sessions_user_id ON public.review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_quiz_id ON public.review_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_completed_at ON public.review_sessions(completed_at);

CREATE INDEX IF NOT EXISTS idx_answer_records_session_id ON public.answer_records(session_id);
CREATE INDEX IF NOT EXISTS idx_answer_records_question_id ON public.answer_records(question_id);

-- Create function to handle new user registration
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

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ QuizMe schema created successfully!';
    RAISE NOTICE 'Tables created: profiles, quizzes, questions, review_sessions, answer_records';
    RAISE NOTICE 'Row Level Security enabled on all tables';
    RAISE NOTICE 'Indexes created for performance optimization';
END $$;

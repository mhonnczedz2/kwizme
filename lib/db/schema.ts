// Database schema based on 03_Technical_Architecture.md

export const SCHEMA_SQL = `
-- Stores generated quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id TEXT PRIMARY KEY,
    pdf_filename TEXT NOT NULL,

    -- Organizational metadata (optional fields)
    institution TEXT,
    program TEXT,
    course TEXT,
    course_code TEXT,
    topic TEXT,

    difficulty_level TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores individual questions
CREATE TABLE IF NOT EXISTS questions (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id TEXT NOT NULL,
    question_text TEXT NOT NULL,

    -- Answer options and correct answer
    options TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    correct_answer_index INTEGER,

    -- Question metadata
    explanation TEXT,
    citation TEXT,
    hint TEXT,
    difficulty TEXT,

    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);

-- Tracks user quiz sessions
CREATE TABLE IF NOT EXISTS review_sessions (
    session_id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER,
    score_percentage REAL,
    time_spent_seconds INTEGER,

    -- Session configuration options
    quick_submit BOOLEAN DEFAULT 0,
    show_explanation BOOLEAN DEFAULT 1,
    time_limit_seconds INTEGER,
    randomize_options BOOLEAN DEFAULT 0,
    randomize_questions BOOLEAN DEFAULT 0,
    num_questions_selected INTEGER NOT NULL,
    preset_name TEXT,

    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);

-- Tracks individual answers
CREATE TABLE IF NOT EXISTS answer_records (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES review_sessions(session_id),
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_sessions_quiz ON review_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON review_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_answers_session ON answer_records(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answer_records(question_id);

-- Organizational filtering indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_institution ON quizzes(institution);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_code ON quizzes(course_code);
CREATE INDEX IF NOT EXISTS idx_quizzes_created ON quizzes(created_at DESC);
`;

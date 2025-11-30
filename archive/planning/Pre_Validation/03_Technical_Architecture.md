# QuizMe: Technical Architecture

---

## Architecture Overview

### Client-Side PWA Architecture

```
[User Browser - PWA]
    ↓
[SQL.js - Client-Side SQLite]
    ↓
[localStorage/IndexedDB]
    ↓ (only when generating new quiz)
[Vercel Serverless Function] → [OpenAI/Gemini API]
    ↓
[Returns JSON to browser]
    ↓
[Saved locally in SQL.js]
```

### Design Principles

1. **Client-First**: All quiz logic runs in browser for instant feedback
2. **Privacy-First**: User data never stored on our servers
3. **Offline-Capable**: Works without internet after quiz generation
4. **Zero Infrastructure**: No databases or servers to manage
5. **Cost-Optimized**: Serverless only for quiz generation

---

## Technology Stack

### Frontend

**Framework**: React 18 + Next.js 14 (App Router)
- **Why**: Fast development, built-in routing, TypeScript support
- **Why App Router**: Modern patterns, better performance
- **Alternative considered**: Vite + React Router (rejected: fewer features)

**Styling**: TailwindCSS
- **Why**: Rapid UI development, mobile-first responsive design
- **Why not CSS Modules**: Slower iteration, more boilerplate

**Language**: TypeScript
- **Why**: Type safety, better IDE support, fewer runtime errors
- **Trade-off**: Slightly slower development, worth it for quality

**State Management**: React Context + useReducer
- **Why**: Simple, built-in, no external dependencies
- **Alternative considered**: Zustand (rejected: over-engineering for MVP)

**Client-Side Database**: SQL.js
- **Why**: Relational model fits quiz structure, easy SQL queries
- **Why not IndexedDB**: More complex API, harder to query
- **Why not localStorage**: No structured querying, size limits

### Backend

**Hosting**: Vercel
- **Why**: Free tier, zero-config deployment, git integration
- **Costs**: $0/month for MVP usage levels
- **Alternative considered**: Netlify (similar, went with Vercel for better Next.js integration)

**Serverless Functions**: Vercel Serverless Functions
- **Why**: No server management, pay-per-use, auto-scaling
- **Language**: TypeScript/Node.js
- **Timeout**: 10 seconds (sufficient for quiz generation)

**LLM API**: OpenAI GPT-4o-mini or Google Gemini 1.5 Flash
- **Why**: Best balance of quality and cost
- **Cost comparison**:
  - Gemini Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens
  - GPT-4o-mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Decision**: Start with Gemini Flash (cheaper), easy to swap later

### Client-Side Storage

**Primary**: SQL.js (WebAssembly SQLite)
- **Purpose**: Structured quiz data, session history
- **Persistence**: localStorage (auto-save database file)
- **Size limit**: 5-10MB (sufficient for 100+ quizzes)

**Secondary**: IndexedDB
- **Purpose**: Offline quiz cache (PWA service worker)
- **Trade-off**: More complex API, only for offline support

**Tertiary**: localStorage
- **Purpose**: User preferences (dark mode, last quiz ID)
- **Size**: <100KB

---

## Database Schema (Client-Side SQL.js)

### Core Tables

```sql
-- Stores generated quizzes
CREATE TABLE quizzes (
    quiz_id TEXT PRIMARY KEY,
    pdf_filename TEXT NOT NULL,

    -- Organizational metadata (optional fields)
    institution TEXT,           -- e.g., "UC Berkeley", "MIT"
    program TEXT,               -- e.g., "Biology Major", "Computer Science BS"
    course TEXT,                -- e.g., "Introduction to Biology"
    course_code TEXT,           -- e.g., "BIO 101", "CS 50"
    topic TEXT,                 -- e.g., "Cell Biology - Chapter 5"

    difficulty_level TEXT,      -- "easy", "medium", "hard"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores individual questions
CREATE TABLE questions (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id TEXT NOT NULL,
    question_text TEXT NOT NULL,

    -- Answer options and correct answer
    options TEXT NOT NULL,              -- JSON array: ["answer1", "answerA", "1answer", "answer_A"]
    correct_answer TEXT NOT NULL,       -- Actual answer text: "answerA"
    correct_answer_index INTEGER,       -- DEPRECATED: Kept for backward compatibility with old quizzes

    -- Question metadata
    explanation TEXT,                   -- Why the answer is correct
    hint TEXT,                          -- Optional hint (click to reveal, no score impact)
    difficulty TEXT,                    -- "easy", "medium", "hard" (per question)

    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);

-- Tracks user quiz sessions
CREATE TABLE review_sessions (
    session_id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER,
    score_percentage REAL,
    time_spent_seconds INTEGER,

    -- Session configuration options
    quick_submit BOOLEAN DEFAULT FALSE,              -- Auto-submit on answer selection
    show_explanation BOOLEAN DEFAULT TRUE,           -- Display explanation after each answer
    time_limit_seconds INTEGER,                      -- Per-question timer (NULL = no limit)
    randomize_options BOOLEAN DEFAULT FALSE,         -- Shuffle answer choices
    randomize_questions BOOLEAN DEFAULT FALSE,       -- Shuffle question order
    num_questions_selected INTEGER NOT NULL,         -- Number of questions in this session
    preset_name TEXT,                                -- "learn", "test", "fast_learn", "custom"

    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);

-- Tracks individual answers
CREATE TABLE answer_records (
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
```

### Performance Indexes

```sql
-- Quiz session tracking
CREATE INDEX idx_sessions_quiz ON review_sessions(quiz_id);
CREATE INDEX idx_sessions_completed ON review_sessions(completed_at);
CREATE INDEX idx_answers_session ON answer_records(session_id);
CREATE INDEX idx_answers_question ON answer_records(question_id);

-- Organizational filtering (for Check Quizzes and Quiz History)
CREATE INDEX idx_quizzes_institution ON quizzes(institution);
CREATE INDEX idx_quizzes_course_code ON quizzes(course_code);
CREATE INDEX idx_quizzes_created ON quizzes(created_at DESC);
```

### Why This Schema?

**Normalized Design**:
- Quizzes → Questions: 1-to-many (reusable questions)
- Quizzes → Sessions: 1-to-many (retake support)
- Sessions → Answers: 1-to-many (detailed tracking)

**Question Design Decisions**:
- **Text-based answers**: `correct_answer` stores actual answer text, not index
  - ✅ Enables future "randomize options" feature (shuffle array, match text)
  - ✅ More intuitive for data analysis
  - ⚠️ Keep `correct_answer_index` for backward compatibility with old quizzes
- **Per-question difficulty**: Each question has its own difficulty level
  - Quiz-level `difficulty_level` = user-selected override (AI suggests average)
  - Calculated: easy=1, medium=2, hard=3 → average score → final difficulty
- **Hints**: Optional, click-to-reveal, no score impact

**Organizational Metadata**:
- Simple text fields (no foreign keys or complex joins)
- Optional: User can organize quizzes or leave blank
- Flexible: Easy to filter and search
- Future-proof: Can migrate to normalized hierarchy in Phase 2 if needed

**Benefits**:
- ✅ Easy to query past quiz performance
- ✅ Can analyze question-level difficulty
- ✅ Supports quiz retakes without duplication
- ✅ Export-friendly (standard SQLite format)
- ✅ Simple organization without complexity
- ✅ Fast queries with indexes on institution/course_code
- ✅ Future-proof for randomization features

**Trade-offs**:
- ⚠️ No data validation (user can type anything in organization fields)
- ⚠️ Potential duplicates from typos ("BIO 101" vs "BIO-101")
- ⚠️ No enforced hierarchy tree structure
- ⚠️ Deprecated field (`correct_answer_index`) adds slight complexity

**Acceptable for MVP**: Validates core hypothesis first, can upgrade to full hierarchy in Phase 2 based on user feedback.

---

## API Design

### Endpoint: `/api/generate-quiz`

**Method**: POST

**Request**:
```typescript
{
  pdf_file: File,              // PDF binary data
  num_questions: number,       // 10-20
  difficulty?: string,         // "easy" | "medium" | "hard"
  context_hint?: string,       // Optional user description

  // Optional organizational metadata
  organization?: {
    institution?: string,      // e.g., "UC Berkeley"
    program?: string,          // e.g., "Biology Major"
    course?: string,           // e.g., "Introduction to Biology"
    course_code?: string,      // e.g., "BIO 101"
    topic?: string             // e.g., "Cell Biology - Chapter 5"
  }
}
```

**Response**:
```typescript
{
  quiz_id: string,             // UUID
  pdf_filename: string,
  topic: string,               // Extracted by AI or from organization.topic
  difficulty_level: string,    // User-selected override (AI suggests average of questions)

  // Organizational metadata (echoed from request)
  institution?: string,
  program?: string,
  course?: string,
  course_code?: string,

  questions: [
    {
      question: string,
      options: string[],              // ["answer1", "answerA", "1answer", "answer_A"]
      correct_answer: string,         // "answerA" (actual answer text)
      explanation: string,
      hint?: string,                  // Optional hint (click to reveal)
      difficulty: string              // "easy" | "medium" | "hard" (per question)
    }
  ]
}
```

**Error Response**:
```typescript
{
  error: string,
  code: "PDF_PARSE_ERROR" | "LLM_API_ERROR" | "VALIDATION_ERROR",
  retry: boolean
}
```

---

## Data Flow

### Quiz Generation Flow

1. **User uploads PDF** (client-side validation)
2. **Frontend sends PDF to `/api/generate-quiz`** (FormData)
3. **Serverless function**:
   - Extracts text from PDF (pdf-parse)
   - Sends text to LLM API with structured prompt
   - Validates JSON response
   - Returns quiz JSON to client
4. **Frontend receives JSON**:
   - Validates schema
   - Saves to SQL.js database
   - Persists database to localStorage
   - Navigates to quiz page

### Quiz Taking Flow

1. **User selects quiz** (from history)
2. **Frontend loads quiz from SQL.js** (instant, local)
3. **User answers questions**:
   - All logic runs client-side (instant feedback)
   - Progress saved after each answer
4. **User completes quiz**:
   - Session summary calculated
   - Saved to `review_sessions` table
   - Results screen rendered

### Offline Flow (PWA)

1. **Service worker caches app shell** (HTML, CSS, JS)
2. **Quiz data already in localStorage** (SQL.js database)
3. **User opens app offline**:
   - App shell loads from cache
   - Quiz data loads from localStorage
   - Full quiz functionality works (except generation)

---

## Why Client-Side Architecture?

### Benefits

✅ **Zero infrastructure costs** ($0/month vs. $50-200/month for servers)
✅ **Instant feedback** (quiz logic runs on device, <50ms response)
✅ **Offline-capable** (works without internet after generation)
✅ **Privacy-first** (data never leaves device)
✅ **Simpler to build** (no backend API, auth, or database management)
✅ **Scales automatically** (user's device does the work)

### Trade-offs

❌ **No cross-device sync** (acceptable for MVP, add later with accounts)
❌ **Data lost if browser cache cleared** (export feature mitigates)
❌ **No social features possible** (not needed for validation)
❌ **Limited analytics** (can't track usage without pings)

### Acceptable for MVP?

**Yes**, because:
1. Validates core hypothesis (PDF → quiz works)
2. Minimizes cost and complexity
3. Can add cloud features later if validated
4. Privacy is a feature, not a bug

---

## PWA Architecture

### Web App Manifest

```json
{
  "name": "QuizMe - AI Quiz Generator",
  "short_name": "QuizMe",
  "description": "Generate practice quizzes from your PDFs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Strategy

**Cache Strategy**:
- **App shell**: Cache-first (HTML, CSS, JS, icons)
- **API calls**: Network-only (quiz generation requires internet)
- **Quiz data**: Client-side database (no service worker caching needed)

**Offline Behavior**:
- ✅ App loads and displays cached quizzes
- ✅ User can take any previously generated quiz
- ❌ Cannot generate new quizzes (requires LLM API)
- Clear messaging: "You're offline. Generate new quizzes when reconnected."

---

## Security Considerations

### Client-Side Security

1. **No sensitive data**: All data is user's own study materials
2. **No authentication**: No credentials to steal
3. **HTTPS only**: Enforced by Vercel
4. **CSP headers**: Prevent XSS attacks

### Server-Side Security

1. **Rate limiting**: 5 generations per IP per hour (prevents abuse)
2. **File size limit**: 10MB max (prevents memory exhaustion)
3. **Timeout**: 10-second serverless timeout (prevents hanging)
4. **Input validation**: PDF format check, sanitize text input

### API Key Protection

1. **Server-side only**: LLM API keys never exposed to client
2. **Environment variables**: Stored in Vercel env config
3. **Spend cap**: $100/month limit set on LLM provider

---

## Scalability Plan

### MVP (0-100 users)

- **Frontend**: Vercel free tier (100GB bandwidth)
- **Serverless**: Vercel free tier (100GB-hours)
- **Database**: Client-side only (no server costs)
- **LLM API**: ~$3/month

### Growth (100-1,000 users)

- **Frontend**: Still free tier (likely)
- **Serverless**: $0-20/month
- **Database**: Still client-side
- **LLM API**: ~$30/month
- **Total**: ~$50/month

### Scale (1,000-10,000 users)

- **Frontend**: $20/month (Vercel Pro)
- **Serverless**: $50-100/month
- **Database**: Add cloud sync (Supabase free tier → $25/month)
- **LLM API**: $300/month
- **Total**: ~$400/month
- **Revenue needed**: 100 paying users @ $4.99/month = $500/month → profitable

---

## Deployment Architecture

### Production Environment

```
GitHub Repo
    ↓ (git push)
Vercel CI/CD
    ↓
Build Next.js App
    ↓
Deploy to Vercel Edge Network
    ↓
Global CDN (instant worldwide access)
```

### Environment Variables

```bash
# LLM API
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MINUTES=60

# Feature Flags
ENABLE_EXPORT=true
ENABLE_DARK_MODE=false
```

### Monitoring

**Vercel Analytics**:
- Page views
- Load times
- Error rates

**Manual Logs**:
- Quiz generation count (serverless logs)
- Error tracking (console.error → Vercel logs)
- User feedback (Google Form)

---

## Tech Stack Justification

### Why Next.js + Vercel?

✅ **Fast development** (built-in routing, API routes, TypeScript support)
✅ **Free hosting** (Vercel free tier handles 100GB bandwidth)
✅ **Zero config deployment** (git push → live in 30 seconds)
✅ **Serverless functions** (no backend server management)
✅ **Automatic HTTPS** (SSL included)
✅ **Great DX** (hot reload, error overlay, docs)

### Why SQL.js (Client-Side SQLite)?

✅ **Relational data model** (quizzes, questions, sessions naturally relational)
✅ **SQL queries** (easier than IndexedDB API)
✅ **Export/import** (SQLite files portable across devices)
✅ **Zero hosting costs** (runs in browser)
✅ **Mature technology** (SQLite battle-tested since 2000)

**Alternative considered**: IndexedDB directly
**Rejected because**: IndexedDB API more complex, harder to query

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28

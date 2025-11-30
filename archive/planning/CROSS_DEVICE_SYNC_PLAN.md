# Cross-Device Sync Implementation Plan

## Overview

This document outlines the plan to migrate QuizMe from client-side SQL.js storage to a server-side database solution that enables cross-device synchronization.

---

## Current Architecture

- **Database**: SQL.js (client-side SQLite in browser)
- **Storage**: IndexedDB for persistence
- **Limitation**: Data is stored locally per browser, no cross-device sync

---

## Database Options Comparison

### Option 1: Vercel Postgres ⭐ (Recommended for Production)

**Description**: PostgreSQL database with native Vercel integration

**Pros**:
- Seamless integration with existing Vercel deployment
- Built-in connection pooling
- Easy setup via Vercel CLI/Dashboard
- Same hosting provider as app (simplified deployment)

**Cons**:
- Free tier limited to 60 hours compute time/month
- Need to manage connection pooling carefully

**Pricing**:
- Free tier: 60 compute hours, 256 MB storage
- Pro tier: $20/month for 100 compute hours

**Setup**:
```bash
npm install @vercel/postgres
# Create database through Vercel dashboard
# Environment variables auto-configured
```

---

### Option 2: Supabase ⭐ (Recommended for MVP)

**Description**: PostgreSQL with built-in auth, real-time sync, and auto-generated APIs

**Pros**:
- Built-in authentication (email, OAuth, magic links)
- Real-time subscriptions for live updates
- Row-level security for user data isolation
- REST and GraphQL APIs auto-generated
- Generous free tier
- Fastest to implement

**Cons**:
- Another service to manage
- May be overkill if you don't need real-time features

**Pricing**:
- Free tier: 500 MB database, 50k monthly active users
- Pro tier: $25/month

**Setup**:
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

### Option 3: PlanetScale

**Description**: Serverless MySQL with database branching

**Pros**:
- Database branching (Git-like workflow for schema changes)
- No connection limits
- Good performance
- Generous free tier

**Cons**:
- MySQL syntax (different from current SQLite)
- Need separate auth solution

**Pricing**:
- Free tier: 5 GB storage, 1 billion row reads/month
- Scaler tier: $29/month

**Setup**:
```bash
npm install @planetscale/database
```

---

### Option 4: Turso

**Description**: Distributed SQLite optimized for edge deployment

**Pros**:
- Closest to current SQL.js setup (SQLite syntax)
- Edge-replicated for low latency
- Keep existing SQL queries with minimal changes
- Free tier supports 500 databases

**Cons**:
- Newer/less mature ecosystem
- Need separate auth solution

**Pricing**:
- Free tier: 500 databases, 1 GB storage
- Scaler tier: $29/month

**Setup**:
```bash
npm install @libsql/client
```

---

## Recommended Approach

### For MVP/Testing: **Supabase**
- Fastest to implement
- Built-in auth saves development time
- Real-time sync works out of the box
- Generous free tier for testing

### For Production: **Vercel Postgres**
- Better integration with existing Vercel deployment
- Single provider for hosting + database
- Simplified deployment pipeline

---

## Implementation Plan

### Phase 1: Setup & Authentication (4-6 hours)

#### 1.1 Choose and Setup Database
- [ ] Create account with chosen provider (Supabase or Vercel)
- [ ] Create new database instance
- [ ] Configure environment variables in `.env.local`
- [ ] Install required dependencies

#### 1.2 Implement Authentication
- [ ] Install auth library (NextAuth.js for Vercel, Supabase Auth for Supabase)
- [ ] Create auth pages: `/login`, `/signup`
- [ ] Set up session management
- [ ] Add protected route middleware
- [ ] Create `AuthProvider` component

**Dependencies**:
```bash
# For Supabase:
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# For Vercel Postgres + NextAuth:
npm install @vercel/postgres next-auth @auth/prisma-adapter prisma
```

---

### Phase 2: Database Schema Migration (2-3 hours)

#### 2.1 Update Schema with User Support

**Current Schema**:
```sql
-- quizzes table
CREATE TABLE quizzes (...)

-- questions table
CREATE TABLE questions (...)

-- review_sessions table
CREATE TABLE review_sessions (...)

-- answer_records table
CREATE TABLE answer_records (...)
```

**New Schema** (add `user_id` to all tables):
```sql
-- quizzes table
CREATE TABLE quizzes (
  quiz_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- NEW: Associate quiz with user
  quiz_title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  institution TEXT,
  program TEXT,
  course TEXT,
  course_code TEXT,
  topic TEXT,
  difficulty_level TEXT CHECK(difficulty_level IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE  -- NEW
);

-- questions table (no change needed - linked via quiz_id)
CREATE TABLE questions (
  question_id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  citation TEXT,
  hint TEXT,
  difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- review_sessions table
CREATE TABLE review_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- NEW: Associate session with user
  quiz_id TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER,
  score_percentage REAL,
  time_spent_seconds INTEGER,
  quick_submit BOOLEAN DEFAULT 0,
  show_explanation BOOLEAN DEFAULT 1,
  time_limit_seconds INTEGER,
  randomize_options BOOLEAN DEFAULT 0,
  randomize_questions BOOLEAN DEFAULT 0,
  num_questions_selected INTEGER NOT NULL,
  preset_name TEXT CHECK(preset_name IN ('learn', 'test', 'fast_learn', 'custom')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,  -- NEW
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- answer_records table (no change needed - linked via session_id)
CREATE TABLE answer_records (
  record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  selected_answer_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES review_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);

-- NEW: users table (if using Vercel Postgres, otherwise handled by Supabase Auth)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_sessions_user_id ON review_sessions(user_id);
CREATE INDEX idx_sessions_quiz_id ON review_sessions(quiz_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_answers_session_id ON answer_records(session_id);
```

#### 2.2 Data Migration Strategy

**Option A: Fresh Start (Recommended)**
- Users start with empty database
- No migration needed
- Simplest approach

**Option B: Client-Side Export/Import**
- Add "Export Data" feature to current app
- Users download JSON file of their quizzes
- Add "Import Data" feature to new app
- Manual migration per user

---

### Phase 3: API Routes Development (4-6 hours)

#### 3.1 Create API Endpoints

Move all database operations from `lib/db/*` to API routes:

**Quiz Endpoints**:
- `POST /api/quizzes` - Create quiz (from PDF generation)
- `GET /api/quizzes` - List user's quizzes (with filters)
- `GET /api/quizzes/[id]` - Get single quiz with questions
- `PUT /api/quizzes/[id]` - Update quiz
- `DELETE /api/quizzes/[id]` - Delete quiz

**Session Endpoints**:
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List user's sessions
- `GET /api/sessions/[id]` - Get session details
- `PUT /api/sessions/[id]` - Update session (on completion)
- `GET /api/sessions/recent` - Get recent sessions for history view

**Answer Endpoints**:
- `POST /api/answers` - Record answer
- `GET /api/answers?session_id=[id]` - Get answers for session

**Tag Endpoints** (for QuizBrowser):
- `GET /api/tags/institutions` - Get unique institutions
- `GET /api/tags/programs` - Get unique programs
- `GET /api/tags/courses` - Get unique courses

#### 3.2 Implement Row-Level Security (RLS)

Ensure users can only access their own data:

**Supabase** (built-in RLS):
```sql
-- Enable RLS on all tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Similar policies for other tables
```

**Vercel Postgres** (manual checks in API routes):
```typescript
// In every API route
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Add user_id filter to all queries
const quizzes = await sql`
  SELECT * FROM quizzes
  WHERE user_id = ${session.user.id}
`;
```

---

### Phase 4: Client-Side Refactoring (3-4 hours)

#### 4.1 Replace Database Calls with API Calls

**Before** (direct database access):
```typescript
// lib/db/quiz-storage.ts
export async function getQuizById(quizId: string) {
  const db = await initDatabase();
  const quizzes = executeQuery<Quiz>(db, 'SELECT * FROM quizzes WHERE quiz_id = ?', [quizId]);
  // ...
}
```

**After** (API calls):
```typescript
// lib/api/quizzes.ts
export async function getQuizById(quizId: string): Promise<QuizGenerationResponse> {
  const response = await fetch(`/api/quizzes/${quizId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch quiz');
  }
  return response.json();
}
```

#### 4.2 Update Components

Replace all imports from `lib/db/*` with `lib/api/*`:

**Files to update**:
- `app/page.tsx` - Main app logic
- `components/QuizBrowser.tsx` - Quiz listing
- `components/QuizHistory.tsx` - Session history
- `components/QuizDisplay.tsx` - Taking quiz
- `app/api/generate-quiz/route.ts` - Quiz generation

#### 4.3 Add Loading States

Since API calls are async over network (not instant like local DB):
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchQuizzes = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const data = await getQuizzes();
    setQuizzes(data);
  } catch (err) {
    setError('Failed to load quizzes');
  } finally {
    setIsLoading(false);
  }
};
```

#### 4.4 Remove SQL.js Dependencies

```bash
# Remove old dependencies
npm uninstall sql.js

# Remove old files
rm -rf lib/db/client.ts
rm -rf lib/db/init.sql
# Keep lib/db/types.ts (reuse types)
```

---

### Phase 5: Authentication UI (2-3 hours)

#### 5.1 Create Auth Pages

**Login Page** (`app/login/page.tsx`):
```typescript
'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react'; // or Supabase auth

export default function LoginPage() {
  // Email/password login form
  // OAuth buttons (Google, GitHub)
  // Link to signup page
}
```

**Signup Page** (`app/signup/page.tsx`):
```typescript
'use client';
import { useState } from 'react';

export default function SignupPage() {
  // Email/password signup form
  // OAuth buttons
  // Link to login page
}
```

#### 5.2 Add Protected Routes

**Middleware** (`middleware.ts`):
```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ['/', '/quizzes/:path*', '/history/:path*'],
};
```

#### 5.3 Add User Menu

Update `app/page.tsx` to show user menu:
- User avatar/email in top right
- "Sign Out" button
- "Profile" link (optional)

---

### Phase 6: Testing & Migration (2-3 hours)

#### 6.1 Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Generate quiz and save to database
- [ ] Quiz appears in user's quiz list
- [ ] Take quiz and save session
- [ ] Session appears in history
- [ ] Review past session works
- [ ] Edit quiz works
- [ ] Delete quiz works
- [ ] Tag filters work in QuizBrowser
- [ ] Cross-device sync: Login on different browser shows same quizzes
- [ ] User isolation: Create second account, verify no data leakage

#### 6.2 Performance Testing

- [ ] Quiz list loads quickly (< 1 second)
- [ ] Quiz generation still works
- [ ] Taking quiz feels responsive
- [ ] Large quiz lists paginate properly

#### 6.3 Migration from Old Version

**For existing users**:
1. Show notification: "QuizMe now supports cross-device sync!"
2. Prompt to create account
3. Option to export old quizzes (JSON download)
4. After signup, show import button
5. Upload JSON file to migrate data

---

## Updated File Structure

```
quizme/
├── app/
│   ├── api/
│   │   ├── auth/           # NEW: Auth endpoints (if using NextAuth)
│   │   ├── quizzes/
│   │   │   ├── route.ts    # NEW: GET, POST /api/quizzes
│   │   │   └── [id]/
│   │   │       └── route.ts # NEW: GET, PUT, DELETE /api/quizzes/[id]
│   │   ├── sessions/       # NEW: Session CRUD
│   │   ├── answers/        # NEW: Answer recording
│   │   └── tags/           # NEW: Tag filtering
│   ├── login/              # NEW: Login page
│   │   └── page.tsx
│   ├── signup/             # NEW: Signup page
│   │   └── page.tsx
│   └── page.tsx            # Updated: Use API calls
├── lib/
│   ├── api/                # NEW: API client functions
│   │   ├── quizzes.ts
│   │   ├── sessions.ts
│   │   └── answers.ts
│   ├── db/
│   │   ├── client.ts       # REMOVED (replaced by API)
│   │   ├── init.sql        # MOVED to database provider
│   │   └── types.ts        # KEPT (shared types)
│   └── auth.ts             # NEW: Auth configuration
├── components/
│   ├── AuthProvider.tsx    # NEW: Auth context
│   ├── UserMenu.tsx        # NEW: User dropdown
│   └── (existing components updated to use API)
├── middleware.ts           # NEW: Protected routes
└── .env.local
    ├── DATABASE_URL        # NEW
    ├── NEXTAUTH_SECRET     # NEW (if using NextAuth)
    └── NEXTAUTH_URL        # NEW (if using NextAuth)
```

---

## Environment Variables

### Supabase Setup
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-existing-key
```

### Vercel Postgres + NextAuth Setup
```bash
# .env.local
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...

NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000

GEMINI_API_KEY=your-existing-key
```

---

## Estimated Timeline

| Phase | Task | Time Estimate |
|-------|------|---------------|
| 1 | Setup & Authentication | 4-6 hours |
| 2 | Database Schema Migration | 2-3 hours |
| 3 | API Routes Development | 4-6 hours |
| 4 | Client-Side Refactoring | 3-4 hours |
| 5 | Authentication UI | 2-3 hours |
| 6 | Testing & Migration | 2-3 hours |
| **Total** | | **17-25 hours** |

---

## Risks & Mitigation

### Risk 1: Data Loss During Migration
**Mitigation**:
- Implement export/import functionality
- Keep old version live during transition
- Provide clear migration guide

### Risk 2: Performance Degradation
**Mitigation**:
- Add database indexes
- Implement pagination for large lists
- Use connection pooling
- Add loading states to manage user expectations

### Risk 3: Authentication Complexity
**Mitigation**:
- Use battle-tested auth library (NextAuth or Supabase Auth)
- Start with email/password only
- Add OAuth later if needed

### Risk 4: Cost Overruns
**Mitigation**:
- Start with free tiers
- Monitor usage via provider dashboards
- Set up billing alerts
- Optimize queries to reduce database load

---

## Post-Implementation Features

Once sync is working, consider adding:

1. **Offline Support** (Progressive Web App)
   - Cache quizzes locally
   - Sync when back online
   - Service worker for offline quiz-taking

2. **Real-Time Collaboration** (if using Supabase)
   - Share quizzes with friends
   - Live leaderboards
   - Collaborative quiz creation

3. **Data Analytics**
   - Track performance over time
   - Identify weak topics
   - Study recommendations

4. **Social Features**
   - Public quiz library
   - Share quizzes via link
   - Quiz ratings and reviews

---

## Decision: Which Option to Choose?

### Choose **Supabase** if:
- ✅ You want to ship fastest (built-in auth)
- ✅ You want real-time features later
- ✅ You prefer managed solution with less config
- ✅ You want generous free tier

### Choose **Vercel Postgres** if:
- ✅ You want single provider for everything
- ✅ You're already comfortable with Vercel
- ✅ You prefer tighter integration with Next.js
- ✅ You plan to stay on Vercel long-term

### My Recommendation: **Start with Supabase**
- Get to market faster with built-in auth
- Can always migrate to Vercel Postgres later if needed
- Free tier is more generous for initial testing
- Real-time features are a nice bonus for future

---

## Next Steps

1. **Review this plan** - Discuss any questions or concerns
2. **Choose database provider** - Supabase vs Vercel Postgres
3. **Set up development environment** - Create account, test database
4. **Begin Phase 1** - Implement authentication
5. **Iterate** - Build, test, deploy incrementally

---

## Questions to Consider

- Do you want to support OAuth login (Google, GitHub)? Or just email/password?
- Should old quizzes be migrated automatically or require manual export/import?
- Do you want to support anonymous quiz generation before requiring signup?
- Should quiz history be retroactive or only track new sessions?
- Do you need real-time features (live leaderboards, collaborative editing)?

---

## References

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)

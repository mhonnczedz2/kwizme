# Database Schema Files

This folder contains all SQL scripts for setting up and verifying the QuizMe Supabase database.

## Setup Files

### 1. `supabase_complete_schema.sql`
**Main database schema - Run this first on a fresh Supabase project**

Creates:
- 5 tables: `profiles`, `quizzes`, `questions`, `review_sessions`, `answer_records`
- Row Level Security (RLS) policies for data isolation
- Indexes for query performance
- Triggers for auto-profile creation and timestamp updates
- All foreign key relationships

### 2. `supabase_enable_realtime.sql`
**Enable real-time subscriptions - Run after complete schema**

Enables Supabase realtime publication on all tables so the app can:
- Receive live database updates
- Sync quiz changes across devices instantly
- Show real-time session updates

**Note**: This is required for the `useRealtimeSync` hook to work properly.

### 3. `supabase_fix_schema.sql`
**Fix for missing profile columns**

Adds `institution` and `program` columns to the `profiles` table if they're missing. These are required for:
- User signup flow (captures institution/program during registration)
- `handle_new_user()` trigger to work correctly

Run this if the verification script shows missing profile columns.

## Verification Files

### 4. `supabase_verify_schema_results.sql`
**Comprehensive schema verification script**

Checks and returns a results table with the status of:
- ✅ All 5 required tables
- ✅ Required columns (especially `profiles.institution`, `profiles.program`)
- ✅ Data types (e.g., `quizzes.quiz_id` should be TEXT not UUID)
- ✅ Row Level Security enabled on all tables
- ✅ Performance indexes
- ✅ Functions and triggers
- ✅/⚠️ Realtime publication status

**Usage**: Run in Supabase SQL Editor and view results in the "Results" tab.

---

## Setup Order

For a fresh Supabase project:

1. **Run** `supabase_complete_schema.sql` (sets up all tables and policies)
2. **Run** `supabase_enable_realtime.sql` (enables live sync)
3. **Run** `supabase_verify_schema_results.sql` (verify everything is ✅)

If verification shows issues:
- Missing profile columns → Run `supabase_fix_schema.sql`
- Realtime disabled → Run `supabase_enable_realtime.sql`

---

## Realtime Sync Implementation

The app uses realtime sync in these components:
- **QuizBrowser** (`components/QuizBrowser.tsx:54-64`) - Auto-reloads quiz list when quizzes change
- **QuizHistory** (`components/QuizHistory.tsx:33-43`) - Auto-reloads history when quizzes or sessions change

Both components use the `useRealtimeSync` hook (`lib/hooks/useRealtimeSync.ts`) which subscribes to database changes via `lib/supabase/realtime-sync.ts`.

---

## Troubleshooting

**Issue**: Signup fails with database error
- **Cause**: Missing `profiles.institution` or `profiles.program` columns
- **Fix**: Run `supabase_fix_schema.sql`

**Issue**: Realtime sync not working (no live updates)
- **Cause**: Realtime publication not enabled
- **Fix**: Run `supabase_enable_realtime.sql`

**Issue**: Type mismatch error on `quiz_id`
- **Cause**: `quizzes.quiz_id` is UUID instead of TEXT
- **Fix**: The app uses TEXT for quiz_id (e.g., "quiz_1234"). Verify with verification script.

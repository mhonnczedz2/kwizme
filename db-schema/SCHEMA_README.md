# Database Schema Documentation - KwizMe

**Last Updated**: December 9, 2025
**Live Schema Version**: 8 tables (PostgreSQL + SQLite hybrid architecture)

This folder contains all SQL scripts for setting up and verifying the KwizMe database system, organized into logical folders for easy navigation:

- **Primary**: PostgreSQL via Supabase (authenticated users)
- **Secondary**: SQLite via sql.js (anonymous users in browser)

## 📁 **FOLDER ORGANIZATION**

- **`setup/`** - Core setup files (run in numbered order)
- **`maintenance/`** - Verification, fixes, and cleanup utilities
- **`rate_limiting/`** - Rate limiting enhancements and alternatives
- **`user_management/`** - User management and soft delete system
- **`documentation/`** - Analysis, operational guides, and detailed docs

---

## 📊 **COMPLETE SCHEMA OVERVIEW**

### **Core Application Tables (5)**
- `profiles` - User account information
- `quizzes` - Quiz metadata and content organization
- `questions` - Individual quiz questions and answers
- `review_sessions` - Quiz attempt records and settings
- `answer_records` - Individual question responses per session

### **Rate Limiting & Usage Tracking (3)**
- `daily_usage` - Date-based usage tracking with admin overrides
- `user_limits` - Custom user limits and unlimited access grants
- `quiz_usage` - Timestamp-based usage logging (alternative system)

**Total: 8 tables** with comprehensive Row Level Security, performance indexes, and cross-table relationships.

---

## 🚀 **SETUP FILES** (in `setup/` folder)

### **1. `setup/01_supabase_complete_schema.sql`** ⭐ **MAIN SETUP**
**Run this first on a fresh Supabase project**

Creates the complete database foundation:
- **Core 5 tables**: Full application schema with proper data types
- **Row Level Security (RLS)**: Comprehensive policies for data isolation
- **Performance Indexes**: 20+ indexes optimized for common query patterns
- **Triggers & Functions**: Auto-profile creation and timestamp updates
- **Foreign Key Relationships**: Proper data integrity constraints

### **2. `setup/02_rate_limiting_schema.sql`**
**Rate limiting system - Run after complete schema**

Adds rate limiting capabilities:
- **`daily_usage` table**: Date-based tracking (CURRENT_DATE reset)
- **`user_limits` table**: Admin overrides with expiration support
- **Functions**: `can_generate_quiz()`, `increment_quiz_count()`, `get_user_daily_limit()`
- **IP-based tracking**: Anonymous user rate limiting via IP address
- **Admin controls**: Unlimited access grants and custom limits

### **3. `setup/03_supabase_enable_realtime.sql`**
**Enable real-time subscriptions - Run after schemas**

Enables Supabase realtime publication on all tables:
- Real-time database updates across client connections
- Live quiz synchronization between devices
- Instant session updates for collaborative features

**Required for**: `useRealtimeSync` hook functionality

---

## 🔍 **VERIFICATION & MAINTENANCE** (in `maintenance/` folder)

### **`maintenance/supabase_verify_schema_results.sql`** ⭐ **HEALTH CHECK**
**Comprehensive schema health check**

Returns detailed status table showing:
- ✅ All 8 tables present and properly structured
- ✅ Required columns (especially `profiles.institution`, `profiles.program`)
- ✅ Data types (e.g., `quizzes.quiz_id` as TEXT not UUID)
- ✅ Row Level Security enabled on all tables
- ✅ Performance indexes and their usage statistics
- ✅ Functions, triggers, and realtime publication status

**Usage**: Run in Supabase SQL Editor, view "Results" tab for health report.

### **`maintenance/supabase_fix_schema.sql`** 🩹 **FIXES**
**Profile column fix - Run only if verification shows issues**

Adds missing `institution` and `program` columns to profiles table if they're missing.

### **`maintenance/clear_all_data.sql`** ⚠️ **DEVELOPMENT CLEANUP**
**Comprehensive data cleanup for development environments**

- **PERMANENTLY DELETES ALL DATA** from all 8 tables
- Resets sequences and user authentication
- **⚠️ NEVER run in production!**

### **`maintenance/clear_local_storage.js`** 🧹 **BROWSER CLEANUP**
**Clears browser localStorage for development reset**

---

## 📋 **RECOMMENDED SETUP ORDER**

### **For Fresh Supabase Project:**
```sql
-- 1. Core database setup
\i setup/01_supabase_complete_schema.sql

-- 2. Add rate limiting (primary system)
\i setup/02_rate_limiting_schema.sql

-- 3. Enable real-time features
\i setup/03_supabase_enable_realtime.sql

-- 4. Verify everything works
\i maintenance/supabase_verify_schema_results.sql
```

### **For Existing Projects:**
```sql
-- 1. Check current status
\i maintenance/supabase_verify_schema_results.sql

-- 2. Fix any issues found
\i maintenance/supabase_fix_schema.sql         -- If profile columns missing
\i setup/02_rate_limiting_schema.sql           -- If rate limiting not set up

-- 3. Re-verify
\i maintenance/supabase_verify_schema_results.sql
```

---

## 🏗️ **RATE LIMITING ARCHITECTURE**

### **System 1: Date-Based (Primary - Recommended)**
**Tables**: `daily_usage` + `user_limits`

**Features**:
- Daily reset at midnight (CURRENT_DATE)
- Admin override system with expiration dates
- Default 5 quizzes/day limit
- Supports unlimited access grants
- IP-based tracking for anonymous users

**Functions**:
```sql
-- Check if user can generate quiz
SELECT * FROM can_generate_quiz('user_id'::UUID);

-- Increment usage counter
SELECT increment_quiz_count('user_id'::UUID, CURRENT_DATE);

-- Get user's current limits
SELECT * FROM get_user_daily_limit('user_id'::UUID);
```

### **System 2: Timestamp-Based (Alternative)**
**Tables**: `quiz_usage`

**Features**:
- Granular timestamp tracking
- Simpler structure
- Good for analytics
- Mixed user/IP support

**Use Case**: Analytics, detailed usage patterns, backup tracking system.
**Location**: `rate_limiting/quiz_usage_schema.sql`

### **Anonymous User Support**
Both systems support IP-based rate limiting for anonymous users:
```sql
-- Anonymous user tracking
SELECT increment_quiz_count_ip('192.168.1.1'::INET, CURRENT_DATE);
```

---

## ⚡ **RATE LIMITING ENHANCEMENTS** (in `rate_limiting/` folder)

### **Production Safety**
- **`rate_limiting_function_fix.sql`** - Race-condition-free increment functions
- **`rate_limiting_ip_function.sql`** - Anonymous user IP-based tracking
- **`rate_limiting_functions.sql`** - Additional function definitions

### **Development & Testing**
- **`rate_limiting_examples.sql`** - Usage examples and test cases
- **`quiz_usage_schema.sql`** - Alternative timestamp-based system

**Recommendation**: Always apply the function fix for production environments to prevent race conditions in concurrent usage tracking.

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **High-Performance Indexes**
Based on live usage statistics:

**Most Used** (optimize these first):
- `idx_questions_quiz_id` - 6,605 reads (question lookups)
- `idx_quizzes_user_id` - 2,906 reads (user's quizzes)
- `quizzes_pkey` - 1,488 reads (quiz access)

**Well Optimized**:
- Quiz browsing by user (fast user dashboard loading)
- Question retrieval by quiz (efficient quiz display)
- Session management (quick session lookups)

**Potential Cleanup**:
- `idx_quizzes_institution` (0 reads) - consider removal
- `idx_quizzes_course_code` (0 reads) - review necessity

### **Query Performance Tips**
```sql
-- ✅ GOOD: Use indexed columns
SELECT * FROM quizzes WHERE user_id = auth.uid();

-- ✅ GOOD: Efficient question loading
SELECT * FROM questions WHERE quiz_id = 'quiz_123';

-- ⚠️ CAREFUL: Unindexed searches may be slow on large datasets
SELECT * FROM quizzes WHERE description ILIKE '%math%';
```

---

## 🔒 **SECURITY FEATURES**

### **Row Level Security (RLS)**
All 8 tables have comprehensive RLS policies:

**User Data Isolation**:
- Users can only access their own quizzes, sessions, and answers
- Proper inheritance (questions→quizzes, answer_records→sessions)
- Anonymous users isolated to IP-based records only

**Admin Controls**:
- Service role policies for admin operations
- Rate limiting overrides via `user_limits` table
- Secure admin functions with proper authorization checks

**Anonymous User Support**:
- Secure IP-based rate limiting
- No cross-user data leakage
- Proper session isolation

---

## 🔄 **REALTIME SYNC IMPLEMENTATION**

### **Application Integration**
The realtime system is integrated in these components:

**Components Using Realtime**:
- **QuizBrowser** (`components/QuizBrowser.tsx:54-64`) - Auto-reloads when quizzes change
- **QuizHistory** (`components/QuizHistory.tsx:33-43`) - Live session updates

**Implementation**:
- Uses `useRealtimeSync` hook (`lib/hooks/useRealtimeSync.ts`)
- Powered by `lib/supabase/realtime-sync.ts`
- Requires `supabase_enable_realtime.sql` to be executed

---

## 🛠️ **TROUBLESHOOTING GUIDE**

### **Common Issues & Solutions**

**Issue**: Signup fails with database error
- **Cause**: Missing `profiles.institution` or `profiles.program` columns
- **Fix**: Run `supabase_fix_schema.sql`
- **Verify**: Check `supabase_verify_schema_results.sql`

**Issue**: Realtime sync not working (no live updates)
- **Cause**: Realtime publication not enabled
- **Fix**: Run `supabase_enable_realtime.sql`
- **Verify**: Check Components → QuizBrowser for live updates

**Issue**: Rate limiting not working
- **Cause**: Rate limiting schema not installed
- **Fix**: Run `rate_limiting_schema.sql`
- **Test**: Try `can_generate_quiz()` function

**Issue**: Type mismatch error on `quiz_id`
- **Cause**: Application expects TEXT but database has UUID
- **Note**: KwizMe uses TEXT for quiz_id (e.g., "quiz_1234")
- **Verify**: `quizzes.quiz_id` should be TEXT data type

**Issue**: Performance slow on quiz loading
- **Cause**: Missing or unused indexes
- **Check**: Run verification script to see index usage
- **Fix**: Review `idx_questions_quiz_id` and `idx_quizzes_user_id` status

---

## 🗂️ **FILE ORGANIZATION**

### **Primary Setup Files**
- `supabase_complete_schema.sql` - Main database schema ⭐
- `supabase_enable_realtime.sql` - Realtime features
- `supabase_verify_schema_results.sql` - Health check

### **Rate Limiting System**
- `rate_limiting_schema.sql` - Complete rate limiting setup
- `rate_limiting_functions.sql` - Function definitions
- `rate_limiting_ip_function.sql` - Anonymous user support
- `quiz_usage_schema.sql` - Alternative tracking system

### **Maintenance & Fixes**
- `supabase_fix_schema.sql` - Profile column fix
- `rate_limiting_function_fix.sql` - Function updates
- `rate_limiting_examples.sql` - Usage examples

### **Documentation & Analysis**
- `SCHEMA_README.md` - This comprehensive guide
- `db_discovery_results.md` - Live schema analysis
- `schema_comparison_analysis.md` - Documentation vs reality
- `CLEANUP_GUIDE.md` - Data cleanup procedures

### **User Management** (See `/user_management/` folder)
- `complete_user_management.sql` - Soft delete system
- `USER_MANAGEMENT_GUIDE.md` - Implementation guide

---

## 📊 **CURRENT DATABASE STATISTICS**

**Live Data Overview** (as of Dec 9, 2025):
- **Total Tables**: 8
- **Total Size**: ~912 kB
- **Most Active**: `questions` (394 rows, 5,761 operations)
- **User Profiles**: 2 (development environment)
- **Performance**: Excellent (small dataset, optimized indexes)

**Index Performance**:
- 24 indexes total
- Top performer: `idx_questions_quiz_id` (6,605 reads)
- Well-utilized user and quiz indexes
- Some unused indexes ready for cleanup

---

## 🚀 **NEXT STEPS & RECOMMENDATIONS**

### **Immediate Actions**
1. **Standardize Rate Limiting**: Choose primary system (date-based recommended)
2. **Index Cleanup**: Review unused indexes (`idx_quizzes_institution`, etc.)
3. **Function Audit**: Consolidate duplicate trigger functions if needed
4. **Documentation**: Keep this file updated with schema changes

### **Future Considerations**
1. **Scaling Preparation**: Monitor query performance as data grows
2. **Analytics Enhancement**: Consider expanding `quiz_usage` for insights
3. **Backup Strategy**: Document backup procedures for both PostgreSQL and SQLite
4. **Migration Planning**: Create procedures for future schema changes

---

## 📞 **SUPPORT & MAINTENANCE**

**For Schema Issues**:
1. Run `supabase_verify_schema_results.sql` first
2. Check this documentation for common solutions
3. Review `schema_comparison_analysis.md` for known issues

**For Performance Issues**:
1. Check index usage in verification results
2. Review query patterns in application code
3. Consider index adjustments based on usage statistics

**For Development Setup**:
Follow the recommended setup order above and verify each step with the verification script.

---

**⭐ This documentation reflects the actual live database schema as of December 9, 2025. For the most current information, always run the verification script after any changes.**
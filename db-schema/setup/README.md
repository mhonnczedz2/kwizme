# Setup Scripts - KwizMe Database

**Purpose**: Core database setup files for fresh Supabase projects

**Run these files in order** to set up the complete KwizMe database schema:

---

## 📋 **Setup Order**

### **1. `01_supabase_complete_schema.sql`** ⭐ **START HERE**
**What it does**:
- Creates all 5 core tables (profiles, quizzes, questions, review_sessions, answer_records)
- Sets up Row Level Security (RLS) policies
- Creates performance indexes
- Adds functions and triggers for user management
- Establishes foreign key relationships

**When to run**: First, on a fresh Supabase project

---

### **2. `02_rate_limiting_schema.sql`** 📊 **RATE LIMITING**
**What it does**:
- Adds 2 rate limiting tables (daily_usage, user_limits)
- Creates rate limiting functions (can_generate_quiz, increment_quiz_count, etc.)
- Sets up admin override system
- Enables IP-based tracking for anonymous users

**When to run**: After core schema, if you need rate limiting

---

### **3. `03_supabase_enable_realtime.sql`** 🔄 **REAL-TIME**
**What it does**:
- Enables Supabase realtime subscriptions on all tables
- Required for live quiz synchronization
- Powers the `useRealtimeSync` hook in the application

**When to run**: After schemas, if you need real-time features

---

## 🚀 **Quick Setup**

### **For New Projects**:
```bash
# In Supabase SQL Editor, run in order:
1. 01_supabase_complete_schema.sql
2. 02_rate_limiting_schema.sql
3. 03_supabase_enable_realtime.sql

# Then verify with:
../maintenance/supabase_verify_schema_results.sql
```

### **For Existing Projects**:
```bash
# Check what you have first:
../maintenance/supabase_verify_schema_results.sql

# Then run only what's missing
```

---

## ✅ **What You Get**

After running all setup scripts:
- ✅ **8 tables** with proper relationships
- ✅ **Row Level Security** on all tables
- ✅ **24 performance indexes**
- ✅ **Rate limiting system** (5 quizzes/day default)
- ✅ **Real-time subscriptions** for live updates
- ✅ **User management triggers** for automatic profile creation
- ✅ **Anonymous user support** via IP tracking

---

## 🛟 **Need Help?**

- **Verification Issues**: Check `../maintenance/supabase_verify_schema_results.sql`
- **Column Missing**: Run `../maintenance/supabase_fix_schema.sql`
- **Rate Limiting Help**: See `../rate_limiting/README.md`
- **Full Documentation**: See `../SCHEMA_README.md`

---

**💡 Pro Tip**: Always run the verification script after setup to ensure everything is working correctly!
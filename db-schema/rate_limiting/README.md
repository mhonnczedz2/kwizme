# Rate Limiting System - KwizMe Database

**Purpose**: Advanced rate limiting functionality and enhancements

This folder contains all files related to rate limiting beyond the basic setup.

---

## 📊 **Rate Limiting Architecture**

KwizMe uses a **dual-system approach** for rate limiting:

### **System 1: Date-Based (Primary - Recommended)**
- **Tables**: `daily_usage` + `user_limits`
- **Reset**: Daily at midnight (CURRENT_DATE)
- **Features**: Admin overrides, expiration dates, unlimited access
- **Setup**: `../setup/02_rate_limiting_schema.sql`

### **System 2: Timestamp-Based (Alternative)**
- **Tables**: `quiz_usage`
- **Reset**: Rolling 24-hour periods
- **Features**: Simpler structure, better for analytics
- **Setup**: `quiz_usage_schema.sql`

---

## 🔧 **Enhancement Files**

### **`rate_limiting_function_fix.sql`** 🛠️ **RACE CONDITION FIX**
**What it does**:
- Replaces `increment_quiz_count()` with race-condition-free version
- Uses single UPSERT operation instead of SELECT + UPDATE
- Critical for production environments with concurrent users

**When to use**:
- ✅ **Always run in production** - prevents counting errors
- ✅ After basic rate limiting setup
- ✅ If you see inconsistent usage counts

---

### **`rate_limiting_ip_function.sql`** 🌐 **ANONYMOUS USER SUPPORT**
**What it does**:
- Adds `increment_quiz_count_ip()` function for anonymous users
- Creates IP-based rate limiting for non-authenticated users
- Adds RLS policies for anonymous access

**When to use**:
- ✅ If you allow anonymous quiz generation
- ✅ For demo/trial functionality
- ✅ To prevent anonymous user abuse

---

### **`quiz_usage_schema.sql`** 📈 **ALTERNATIVE SYSTEM**
**What it does**:
- Creates `quiz_usage` table for timestamp-based tracking
- Simpler logging approach than daily_usage
- Better for analytics and detailed usage patterns

**When to use**:
- 🤔 **If you prefer timestamp-based rate limiting**
- 🤔 **For detailed usage analytics**
- 🤔 **As migration target from daily_usage system**

**⚠️ Decision Needed**: Choose either daily_usage OR quiz_usage as primary

---

### **`rate_limiting_examples.sql`** 📚 **USAGE EXAMPLES**
**What it does**:
- Example queries for common rate limiting operations
- Test data creation
- Sample admin operations

**When to use**:
- 📖 Learning how to use rate limiting functions
- 📖 Testing rate limiting functionality
- 📖 Implementing admin interfaces

---

### **`rate_limiting_functions.sql`** 🔍 **FUNCTION REFERENCE**
**What it does**:
- Additional or alternative function definitions
- May duplicate main setup functions

**When to use**:
- 🔍 **Review first** - may be redundant with main setup
- 🔍 **Use if different from setup version**

---

## 🚀 **Recommended Implementation Path**

### **For New Projects**:
```sql
-- 1. Basic rate limiting setup
../setup/02_rate_limiting_schema.sql

-- 2. Production safety fix
rate_limiting_function_fix.sql

-- 3. Anonymous user support (optional)
rate_limiting_ip_function.sql

-- 4. Verify everything works
../maintenance/supabase_verify_schema_results.sql
```

### **For Existing Projects**:
```sql
-- 1. Check current status
../maintenance/supabase_verify_schema_results.sql

-- 2. Add missing pieces as needed
-- 3. Apply function fixes for production safety
```

---

## 📋 **Common Functions Available**

### **User Rate Limiting**
```sql
-- Check if user can generate quiz
SELECT * FROM can_generate_quiz('user_id'::UUID);

-- Increment user's usage count
SELECT increment_quiz_count('user_id'::UUID, CURRENT_DATE);

-- Get user's daily limits
SELECT * FROM get_user_daily_limit('user_id'::UUID);
```

### **Anonymous User Rate Limiting**
```sql
-- Increment IP-based usage
SELECT increment_quiz_count_ip('192.168.1.1'::INET, CURRENT_DATE);
```

### **Admin Operations**
```sql
-- Grant unlimited access
INSERT INTO user_limits (user_id, is_unlimited, reason)
VALUES ('user_id'::UUID, TRUE, 'Premium subscriber');

-- Set custom daily limit
INSERT INTO user_limits (user_id, daily_limit, reason)
VALUES ('user_id'::UUID, 50, 'Beta tester');
```

---

## 🔄 **System Migration**

### **From daily_usage to quiz_usage**:
If you want to migrate to the timestamp-based system:

1. **Deploy quiz_usage_schema.sql**
2. **Update application code** to use quiz_usage table
3. **Test thoroughly** in development
4. **Migrate production data** (custom script needed)
5. **Remove daily_usage tables** after verification

### **Dual System Approach**:
You can run both systems simultaneously:
- **daily_usage**: For user-facing rate limiting
- **quiz_usage**: For analytics and detailed tracking

---

## ⚙️ **Configuration Options**

### **Default Settings**:
- **Daily Limit**: 5 quizzes per user per day
- **Anonymous Limit**: Same as authenticated users
- **Admin Override**: Unlimited access via user_limits table

### **Customization**:
- Modify default limits in rate limiting functions
- Add expiration dates to user overrides
- Implement different limits for different user types

---

## 🛟 **Troubleshooting**

### **Rate Limiting Not Working**:
```sql
-- Check functions exist
SELECT * FROM can_generate_quiz('test_user_id');

-- Check tables exist
SELECT COUNT(*) FROM daily_usage;

-- Verify with maintenance script
../maintenance/supabase_verify_schema_results.sql
```

### **Inconsistent Counts**:
```sql
-- Apply race condition fix
rate_limiting_function_fix.sql

-- Check for concurrent usage issues
```

### **Anonymous Users Can't Generate**:
```sql
-- Add IP-based support
rate_limiting_ip_function.sql
```

---

**💡 Pro Tip**: Start with the basic setup, add the function fix for production safety, then add features like anonymous support as needed. Don't overthink the dual system choice - daily_usage works great for most use cases!
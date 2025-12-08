# Maintenance Scripts - KwizMe Database

**Purpose**: Verification, fixes, and cleanup utilities for database maintenance

These scripts help you maintain, verify, and troubleshoot your KwizMe database.

---

## 🔍 **Verification & Health Checks**

### **`supabase_verify_schema_results.sql`** ⭐ **HEALTH CHECK**
**What it does**:
- Verifies all 8 tables exist and are properly configured
- Checks Row Level Security (RLS) is enabled
- Validates indexes, functions, and triggers
- Tests realtime subscriptions
- Returns easy-to-read status table

**When to use**:
- ✅ After fresh setup to verify everything works
- ✅ Before production deployment
- ✅ When troubleshooting issues
- ✅ After schema changes

**Usage**:
```sql
-- Run in Supabase SQL Editor, check Results tab
-- Look for ❌ MISSING or ❌ DISABLED items
```

---

## 🔧 **Fix & Repair Scripts**

### **`supabase_fix_schema.sql`** 🩹 **COLUMN FIX**
**What it does**:
- Adds missing `institution` and `program` columns to profiles table
- Fixes common setup issues

**When to use**:
- ❌ If verification shows missing profile columns
- ❌ If user signup fails with database errors

---

## 🧹 **Development Cleanup**

### **`clear_all_data.sql`** ⚠️ **NUCLEAR OPTION**
**What it does**:
- **PERMANENTLY DELETES ALL DATA** from all 8 tables
- Deletes all users from auth.users
- Resets auto-increment sequences
- Preserves schema, indexes, and policies

**When to use**:
- 🔄 Development environment reset
- 🔄 Want to re-signup with same email
- 🔄 Clear test data

**⚠️ DANGER**:
- **NEVER run in production!**
- **Cannot be undone!**
- **Always backup first!**

---

### **`clear_local_storage.js`** 🧹 **BROWSER CLEANUP**
**What it does**:
- Clears browser localStorage for KwizMe
- Removes cached authentication and app data

**When to use**:
- 🔄 After running clear_all_data.sql
- 🔄 Browser showing old cached data
- 🔄 Authentication issues

**Usage**:
```javascript
// Run in browser console (F12)
// Copy and paste the script
```

---

## 📋 **Maintenance Workflow**

### **Regular Health Checks**
```sql
-- 1. Weekly verification
supabase_verify_schema_results.sql

-- 2. Look for any ❌ items and investigate
-- 3. Run fixes if needed
```

### **Development Reset**
```sql
-- 1. Backup important data first!
-- 2. Run clear_all_data.sql
-- 3. Clear browser storage (clear_local_storage.js)
-- 4. Verify with supabase_verify_schema_results.sql
-- 5. Sign up with fresh account
```

### **Production Deployment**
```sql
-- 1. Run verification on staging
-- 2. Fix any issues found
-- 3. Run verification on production after deployment
-- 4. Monitor for issues
```

---

## 🚨 **Troubleshooting Common Issues**

### **User Signup Fails**
```sql
-- Check: Missing profile columns
supabase_verify_schema_results.sql

-- Fix: Add missing columns
supabase_fix_schema.sql
```

### **No Live Updates in App**
```sql
-- Check: Realtime not enabled
supabase_verify_schema_results.sql

-- Fix: Enable realtime
../setup/03_supabase_enable_realtime.sql
```

### **Rate Limiting Not Working**
```sql
-- Check: Rate limiting functions missing
supabase_verify_schema_results.sql

-- Fix: Install rate limiting
../setup/02_rate_limiting_schema.sql
```

### **Performance Issues**
```sql
-- Check: Missing indexes
supabase_verify_schema_results.sql

-- Solution: Recreate schema or add specific indexes
../setup/01_supabase_complete_schema.sql
```

---

## 📞 **Need More Help?**

- **Setup Issues**: See `../setup/README.md`
- **Rate Limiting**: See `../rate_limiting/README.md`
- **Full Documentation**: See `../SCHEMA_README.md`
- **Operational Guide**: See `../documentation/operational_runbook.md`

---

**💡 Pro Tip**: Always run the verification script first when troubleshooting - it will show you exactly what's missing or broken!
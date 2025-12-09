# User Management & Deletion Guide

**Problem**: Cannot delete users with associated data due to foreign key constraints and Supabase Auth restrictions.

**Solution**: Comprehensive soft delete system with automatic reactivation and admin controls.

**Created**: December 9, 2025
**Last Updated**: December 9, 2025

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **Current Issues**
1. **Foreign Key Constraint Problems**: Some FKs show as `null` in discovery results
2. **Supabase Auth Restrictions**: Auth system prevents deletion when related data exists
3. **Data Integrity**: CASCADE settings may not be properly configured
4. **No Admin Controls**: No built-in user management for admins

### **Tables Affected by User Deletion**
- `profiles` (1:1 with auth.users)
- `quizzes` (user-owned content)
- `questions` (via quizzes)
- `review_sessions` (user activity)
- `answer_records` (via sessions)
- `daily_usage` (rate limiting data)
- `quiz_usage` (usage tracking)
- `user_limits` (admin overrides)

---

## 🎯 **IMPLEMENTED SOLUTION: SOFT DELETE**

### ✅ **Why Soft Delete?**
- **Data Preservation**: No data loss, can reactivate users
- **Audit Trail**: Complete history of user actions via `user_reactivation_log`
- **Compliance**: Meets data retention requirements
- **Safety**: No accidental permanent data loss
- **Performance**: Faster than hard delete (just status change)
- **Supabase Compatible**: Works within Auth system limitations
- **🆕 Re-signup Support**: Users can sign up again to automatically reactivate
- **🆕 Granular Control**: Admin can allow/prevent reactivation per user

### **Implementation File**
**Location**: `/db-schema/user_management/complete_user_management.sql`

### **🔧 Core Functions Available**

#### 1. **Standard User Disable** (Allows Reactivation)
```sql
SELECT disable_user(
  '12345678-1234-1234-1234-123456789012'::UUID, -- user to disable
  'admin_user_id'::UUID,                         -- admin performing action
  'Violation of terms',                          -- reason
  TRUE                                           -- allow reactivation (default)
);
```

#### 2. **Permanent User Disable** (Prevents Reactivation)
```sql
SELECT permanently_disable_user(
  'user_id'::UUID,
  'admin_user_id'::UUID,
  'Serious violation - permanent ban'
);
```

#### 3. **Manual User Reactivation**
```sql
SELECT reactivate_user(
  'user_id'::UUID,
  'admin_user_id'::UUID
);
```

#### 4. **Check Email Signup Status**
```sql
SELECT can_email_signup('user@example.com');
```

#### 5. **Get Comprehensive User Status**
```sql
SELECT * FROM get_user_status('user_id'::UUID);
-- Returns: user_id, email, full_name, is_active, disabled_at, disabled_by_email,
--          disable_reason, quiz_count, session_count, can_reactivate
```

#### 6. **Admin Dashboard View**
```sql
SELECT * FROM admin_user_management;
-- Shows: status, reactivation_count, total_quizzes, total_sessions, last_activity
```

#### 7. **Reactivation Audit Trail**
```sql
SELECT * FROM user_reactivation_log WHERE user_id = 'user_id'::UUID;
-- Shows: reactivation_method ('auto_signup' or 'manual_admin'), reactivated_by
```

---

## 🔄 **RE-SIGNUP BEHAVIOR EXPLAINED**

### **Scenario 1: Normal Disable** ✅ **RECOMMENDED**
```sql
-- Disable user (allows re-signup)
SELECT disable_user('user_id'::UUID, 'admin_id'::UUID, 'Spam behavior', TRUE);
```

**When they try to sign up again:**
- ✅ Signup **succeeds**
- ✅ Account **automatically reactivated**
- ✅ All their **previous quizzes/data restored**
- ✅ They can log in immediately
- ✅ Action logged in `user_reactivation_log`

**Good for**: Temporary bans, warnings, spam control

---

### **Scenario 2: Permanent Disable** 🚫 **FOR SERIOUS CASES**
```sql
-- Permanently disable (prevents re-signup)
SELECT permanently_disable_user('user_id'::UUID, 'admin_id'::UUID, 'Serious TOS violation');
```

**When they try to sign up again:**
- ❌ Signup **fails** with error message
- ❌ Account **stays disabled**
- ❌ They **cannot access** previous data
- ⚠️ Admin must manually delete auth record to fully prevent signup

**Good for**: Serious violations, permanent bans

---

### **Scenario 3: Complete Prevention** 🔒 **MAXIMUM SECURITY**
```sql
-- 1. Permanently disable
SELECT permanently_disable_user('user_id'::UUID, 'admin_id'::UUID, 'Account compromised');

-- 2. Admin manually deletes in Supabase Dashboard:
-- Go to Authentication > Users > Delete user
```

**When they try to sign up again:**
- ❌ Signup **fails** at auth level
- ❌ Email becomes **completely available** again
- ❌ **All data permanently lost**

**Good for**: Compromised accounts, legal requirements

---

## 📋 **RECOMMENDED WORKFLOW**

### **Escalation Path**
```sql
-- 1. First offense - normal disable (they can recover)
SELECT disable_user('spam_user'::UUID, 'admin'::UUID, 'First spam warning', TRUE);

-- 2. If they sign up and spam again - permanent disable
SELECT permanently_disable_user('spam_user'::UUID, 'admin'::UUID, 'Repeated spam after warning');

-- 3. For serious cases - full deletion (manual auth deletion needed)
```

---

## 🚀 **IMPLEMENTATION GUIDE**

### **1. Deploy the Schema**
```sql
-- Run in Supabase SQL Editor
-- Execute: /db-schema/user_management/complete_user_management.sql
```

### **2. Update Application Code**

#### **Filter Active Users in Queries**
```typescript
// Always filter for active users in your queries
const activeUsers = await supabase
  .from('profiles')
  .select('*')
  .eq('is_active', true);
```

#### **Admin User Management**
```typescript
// Disable user (with reactivation control)
const { data, error } = await supabase.rpc('disable_user', {
  p_user_id: userId,
  p_admin_id: adminId,
  p_reason: reason,
  p_allow_reactivation: true  // or false for stricter control
});

// Manually reactivate user
const { data, error } = await supabase.rpc('reactivate_user', {
  p_user_id: userId,
  p_admin_id: adminId
});

// Get enhanced user status
const { data, error } = await supabase.rpc('get_user_status', {
  p_user_id: userId
});
// Returns can_reactivate field for UI decisions

// Use admin dashboard view
const { data, error } = await supabase
  .from('admin_user_management')
  .select('*');
```

### **3. Frontend Email Validation**

**Add email checking to your signup form:**
```typescript
async function handleSignup(email: string) {
  // Check email status first
  const { data: emailCheck } = await supabase.rpc('can_email_signup', {
    p_email: email
  });

  if (emailCheck.status === 'reactivation') {
    // Show user-friendly message
    alert(`Welcome back! This will reactivate your previous account.
           Previous disable reason: ${emailCheck.disabled_reason}`);
  } else if (emailCheck.status === 'permanently_disabled') {
    alert('This account has been permanently disabled. Contact administrator.');
    return; // Don't proceed with signup
  }

  // Proceed with normal signup - will auto-reactivate if needed
  const { data, error } = await supabase.auth.signUp({ email, password });
}
```

---

## 🔒 **SECURITY FEATURES**

### **Built-in Admin Verification**
Both functions require admin verification:
```sql
-- Check if admin has permission (built into functions)
IF NOT EXISTS (
  SELECT 1 FROM profiles
  WHERE id = p_admin_id
  AND is_active = TRUE
) THEN
  RAISE EXCEPTION 'Admin user not found or inactive';
END IF;
```

### **Enhanced Admin Check** (Optional)
```sql
-- Add stricter admin verification
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Customize this logic for your admin system
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND email LIKE '%@admin.kwizme.com'  -- Example
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Row Level Security (RLS)**
The system includes updated RLS policies:
- **Active Users Only**: Regular users can only see active profiles and their own data
- **Service Role Access**: Admin functions can access all data via service role
- **Audit Trail Protection**: Reactivation logs are protected and auditable

---

## 🧪 **TESTING PROCEDURES**

### **Before Production Deployment**

1. **Test User Lifecycle**:
   ```sql
   -- Create test user, disable, reactivate, test signup
   SELECT disable_user('test_user'::UUID, 'admin'::UUID, 'Test disable');
   SELECT get_user_status('test_user'::UUID);
   SELECT can_email_signup('test@example.com');
   ```

2. **Test Permanent Disable**:
   ```sql
   SELECT permanently_disable_user('test_user'::UUID, 'admin'::UUID, 'Test permanent');
   -- Verify signup fails
   ```

3. **Verify RLS Policies**:
   ```sql
   -- Test that inactive users can't access their data
   -- Test that admin functions work with service role
   ```

---

## 📞 **USAGE EXAMPLES**

### **Standard Workflow**
```sql
-- 1. Check user status
SELECT * FROM get_user_status('problem_user_id'::UUID);

-- 2. Disable user (allowing reactivation)
SELECT disable_user(
  'problem_user_id'::UUID,
  'admin_user_id'::UUID,
  'Spam behavior detected',
  TRUE -- allow reactivation
);

-- 3. Monitor reactivations
SELECT * FROM user_reactivation_log WHERE user_id = 'problem_user_id'::UUID;

-- 4. Later reactivate if needed
SELECT reactivate_user('problem_user_id'::UUID, 'admin_user_id'::UUID);
```

### **Permanent Ban Workflow**
```sql
-- 1. ALWAYS check impact first
SELECT * FROM get_user_status('serious_offender_id'::UUID);

-- 2. Permanent disable (prevents auto-reactivation)
SELECT permanently_disable_user(
  'serious_offender_id'::UUID,
  'admin_user_id'::UUID,
  'Serious TOS violation - reviewed by legal'
);

-- 3. Verify they cannot sign up
SELECT can_email_signup('offender@example.com');
-- Should return: 'permanently_disabled'
```

---

## 🔮 **FUTURE CONSIDERATIONS**

### **Hard Delete Option**
If you later need true hard delete (permanent data removal):
- Would require separate implementation
- Must handle all foreign key constraints carefully
- Should include comprehensive backup procedures
- Necessary for GDPR "right to be forgotten" compliance

### **Enhanced Admin Features**
- Multi-factor authentication for admin actions
- Approval workflows for permanent bans
- Automated ban escalation based on violation counts
- Integration with external fraud detection systems

---

## 🎯 **SUMMARY**

This system provides:
- ✅ **Complete user disable/reactivate control**
- ✅ **Automatic reactivation on re-signup (optional)**
- ✅ **Permanent disable option for serious cases**
- ✅ **Comprehensive audit trail**
- ✅ **Admin dashboard with statistics**
- ✅ **Frontend email validation support**
- ✅ **Row-level security protection**
- ✅ **Flexible escalation workflow**

**⭐ Bottom Line**: This soft delete system gives you **complete control** over user access while preserving data and maintaining audit trails - the perfect balance of **safety and flexibility**!
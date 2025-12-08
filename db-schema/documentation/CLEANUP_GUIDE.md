# Complete Database & Local Storage Cleanup Guide

This guide helps you completely reset KwizMe during development, allowing you to sign up again with the same email.

## 🎯 Problem
After signing up, you can't re-register with the same email even after manually deleting data because:
1. User still exists in `auth.users` database
2. Auth session is cached in browser localStorage
3. User profile exists in `profiles` table
4. Related quiz data remains in database

## ✅ Solution: Two-Step Cleanup Process

### Step 1: Clear Database (Supabase)
**File:** `db-schema/clear_all_data.sql`

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the **entire contents** of `db-schema/clear_all_data.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Check the output for verification report

**What it clears:**
- ✅ All users from `auth.users`
- ✅ All profiles from `profiles`
- ✅ All quizzes, questions, sessions, answers
- ✅ Resets auto-increment sequences

**What it preserves:**
- ✅ Table schemas
- ✅ Row Level Security policies
- ✅ Indexes
- ✅ Functions and triggers
- ✅ Constraints

---

### Step 2: Clear Browser Storage (Local)
**File:** `db-schema/clear_local_storage.js`

1. Open your KwizMe app in browser (e.g., `http://localhost:3001`)
2. Open **DevTools** (F12 or Right Click → Inspect)
3. Go to **Console** tab
4. Copy the **entire contents** of `db-schema/clear_local_storage.js`
5. Paste into Console
6. Press **Enter** to run
7. **Refresh the page** (F5)

**What it clears:**
- ✅ Supabase auth tokens (session, refresh tokens)
- ✅ KwizMe theme preferences
- ✅ Local SQLite database (anonymous user data)
- ✅ All localStorage items
- ✅ All sessionStorage items
- ✅ All cookies
- ✅ IndexedDB databases

---

## 🚀 Quick Start: Complete Reset

### Option A: Full Reset (Recommended)
```bash
# 1. Run SQL script in Supabase Dashboard
#    → Copy db-schema/clear_all_data.sql → Paste in SQL Editor → Run

# 2. Run JS script in browser console
#    → Open DevTools (F12) → Console tab
#    → Copy db-schema/clear_local_storage.js → Paste → Enter

# 3. Refresh browser (F5)

# 4. Sign up with same email! 🎉
```

### Option B: Manual Cleanup (Alternative)
If scripts don't work, you can manually clear:

**Database (Supabase Dashboard):**
1. Authentication → Users → Delete all users
2. Table Editor → Select each table → Delete all rows

**Browser (DevTools):**
1. Open DevTools (F12)
2. Application tab
3. Storage section:
   - Local Storage → Right-click → Clear
   - Session Storage → Right-click → Clear
   - Cookies → Right-click → Clear
   - IndexedDB → Right-click each database → Delete
4. Refresh page (F5)

---

## 📋 Verification Checklist

After running both scripts, verify:

**Database (Supabase Dashboard):**
- [ ] SQL script output shows "SUCCESS! All data has been cleared!"
- [ ] All record counts show 0
- [ ] Authentication → Users shows empty list

**Browser (DevTools Console):**
- [ ] JS script output shows cleanup summary
- [ ] All localStorage/sessionStorage/cookies cleared
- [ ] Application tab shows empty storage

**Final Test:**
- [ ] Refresh page (F5)
- [ ] Go to signup page
- [ ] Try signing up with previously used email
- [ ] Should work without errors! ✅

---

## ⚠️ Important Notes

### Security Warnings
- **NEVER run these scripts in production!**
- These are **development tools only**
- All deletions are **permanent** and **cannot be undone**

### When to Use
- ✅ Local development/testing
- ✅ Need to re-signup with same email
- ✅ Want to start fresh with clean database
- ✅ Testing signup/auth flow

### When NOT to Use
- ❌ Production environment
- ❌ Staging environment with real user data
- ❌ Shared development database with team data

### Common Issues

**Issue:** SQL script runs but users still remain
- **Solution:** Run from Supabase Dashboard (has service role permissions)
- **Alternative:** Manually delete users in Authentication → Users

**Issue:** Browser script runs but still can't signup
- **Solution:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- **Alternative:** Try incognito/private browsing window
- **Alternative:** Clear browser cache manually in browser settings

**Issue:** "User already exists" error after cleanup
- **Solution:** Wait 1-2 minutes for Supabase cache to clear
- **Solution:** Check if user still exists in Dashboard → Authentication → Users
- **Solution:** Try signing up with different email to verify system works

---

## 🔧 Scripts Location

```
kwizme/
└── db-schema/
    ├── clear_all_data.sql          # Step 1: Database cleanup
    ├── clear_local_storage.js      # Step 2: Browser cleanup
    ├── supabase_complete_schema.sql # Original schema (for reference)
    └── CLEANUP_GUIDE.md            # This file
```

---

## 📞 Troubleshooting

### Still can't sign up after cleanup?

1. **Check database:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT email FROM auth.users WHERE email = 'your@email.com';
   ```
   Should return 0 rows.

2. **Check browser storage:**
   - Open DevTools → Application → Local Storage
   - Should be empty or have no Supabase items

3. **Try incognito mode:**
   - Opens fresh browser with no cache
   - If signup works here, browser cache is the issue

4. **Check Supabase logs:**
   - Dashboard → Logs → Auth logs
   - Look for signup errors

5. **Hard refresh:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

---

## 📚 Related Files

- `app/auth/signup/page.tsx` - Signup page component
- `lib/supabase/client.ts` - Supabase browser client
- `lib/db/client.ts` - Local SQLite client
- `db-schema/supabase_complete_schema.sql` - Full database schema

---

**Last Updated:** 2024-12-02
**KwizMe Version:** Development
**Environment:** Local Development Only

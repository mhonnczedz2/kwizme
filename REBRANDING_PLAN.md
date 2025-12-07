# 🎯 QuizMe → KwizMe Rebranding Plan

**Project**: Complete rebrand from "QuizMe" to "KwizMe"
**Scope**: 150+ references across 93 files
**Estimated Time**: 3.5-4.5 days
**Risk Level**: Moderate (due to user data and PWA considerations)

---

## 📋 Pre-Execution Checklist

- [x] **Backup current database** (if using production data)
- [x] **Create feature branch** for rebranding work
- [x] **Document current Vercel/deployment settings**
- [x] **Test local development environment**
- [x] **Notify team/users** of upcoming rebrand (if applicable)

---

## 🎯 Phase 1: Documentation & Low-Risk Changes

**Goal**: Update all documentation and non-functional references
**Risk Level**: ✅ LOW
**Time**: ~1 day

### 1.1 Project Documentation

- [x] **README.md** - Update all QuizMe references
- [x] **Package files**:
  - [x] `/package.json` - Change `"name": "quizme"` → `"name": "kwizme"`
  - [x] `/package-lock.json` - Will auto-update on next npm install

### 1.2 Archive & Planning Documents

- [ ] **Archive folder** (`/archive/`):
  - [ ] `/archive/planning/Pre_Validation/QuizMe_PreValidation_MVP_Plan.md` → rename file
  - [ ] `/archive/planning/Post_Validation/QuizMe_PostValidation_Growth_Plan.md` → rename file
  - [ ] Update all content references in planning documents (30+ files)
  - [ ] `/archive/DEPLOYMENT_FIXES.md` - Update URL references
  - [ ] `/archive/TESTING_CHECKLIST.md` - Update URL references

### 1.3 Support Documentation

- [ ] **Documentation folder** (`/docs/`):
  - [ ] `/docs/CUSTOMER_SUPPORT.md` - Update URLs and references
  - [ ] `/docs/SUPPORT_TEMPLATES.md` - Update support response templates
  - [ ] `/docs/discord-feedback-setup.md` - Update channel naming
  - [ ] `/docs/monitoring.md` - Update Sentry references (prepare for Phase 3)

### 1.4 Database Schema Comments

- [ ] **Database folder** (`/db-schema/`):
  - [ ] Update comment headers in all SQL files (10+ files)
  - [ ] `/db-schema/SCHEMA_README.md` - Update documentation
  - [ ] `/db-schema/CLEANUP_GUIDE.md` - Update references

**✅ Phase 1 Checkpoint**: All documentation updated, no functional changes made

---

## 🔧 Phase 2: Configuration & Build Setup

**Goal**: Update build configuration and environment setup
**Risk Level**: ⚠️ MEDIUM
**Time**: ~0.5 day

### 2.1 Build Configuration

- [ ] **Environment files**:
  - [ ] `/.env.example` - Update URLs: `https://quizme-virid.vercel.app` → `https://kwizme-virid.vercel.app`
  - [ ] Update any local `.env` files (not in git)

- [ ] **Next.js configuration**:
  - [ ] `/next.config.js` - Update Sentry references:
    - [ ] `SENTRY_ORG || "quizme-app"` → `"kwizme-app"`
    - [ ] `SENTRY_PROJECT || "quizme-app"` → `"kwizme-app"`

### 2.2 Testing Phase 2

- [ ] **Test build process**:
  ```bash
  npm run build
  npm run start
  ```
- [ ] **Verify no build errors**
- [ ] **Test basic functionality**

**✅ Phase 2 Checkpoint**: Build configuration updated, app still functional

---

## ⚠️ Phase 3: Critical Technical Infrastructure

**Goal**: Update storage, caching, and core technical references
**Risk Level**: 🚨 HIGH (User data impact)
**Time**: ~1 day

### 3.1 User Data Migration Strategy

**IMPORTANT**: These changes will affect user data. Plan accordingly.

#### 3.1.1 LocalStorage Migration Script

- [ ] **Create migration utility** (`/lib/utils/migration.ts`):

```typescript
// Migration utility to preserve user data during rebrand
export const migrateUserData = () => {
  // Migrate theme preference
  const oldTheme = localStorage.getItem('quizme-theme');
  if (oldTheme) {
    localStorage.setItem('kwizme-theme', oldTheme);
    localStorage.removeItem('quizme-theme');
  }

  // Add other data migrations as needed
  console.log('User data migration completed');
};
```

#### 3.1.2 Database Name Changes

- [ ] **Update database client** (`/lib/db/client.ts`):
  - [ ] Change `const DB_NAME = 'quizme-db'` → `'kwizme-db'`
  - [ ] Add migration logic to copy data from old to new database

#### 3.1.3 Context Updates

- [ ] **Theme context** (`/lib/contexts/ThemeContext.tsx`):
  - [ ] Update localStorage key: `'quizme-theme'` → `'kwizme-theme'`
  - [ ] Update both references in the file

### 3.2 Service Worker Updates

- [ ] **Service Worker** (`/public/sw.js`):
  - [ ] Update cache names: `'quizme-v2'` → `'kwizme-v2'`
  - [ ] Update cache names: `'quizme-runtime-v2'` → `'kwizme-runtime-v2'`
  - [ ] Update notification title: `'QuizMe'` → `'KwizMe'`
  - [ ] Update notification text: `'New notification from QuizMe'` → `'New notification from KwizMe'`

### 3.3 Testing Phase 3 (CRITICAL)

- [ ] **Test local storage migration**:
  - [ ] Set old localStorage data
  - [ ] Run migration
  - [ ] Verify data preserved
- [ ] **Test service worker**:
  - [ ] Clear browser cache
  - [ ] Test offline functionality
  - [ ] Verify notifications work
- [ ] **Test database operations**:
  - [ ] Verify local database functions
  - [ ] Test data persistence

**✅ Phase 3 Checkpoint**: Core infrastructure updated, user data preserved

---

## 🎨 Phase 4: Progressive Web App (PWA)

**Goal**: Update PWA manifest and user-facing app identity
**Risk Level**: ⚠️ MEDIUM
**Time**: ~0.5 day

### 4.1 PWA Manifest

- [ ] **Update manifest** (`/public/manifest.json`):
  - [ ] `"name": "QuizMe - AI Quiz Generator"` → `"KwizMe - AI Quiz Generator"`
  - [ ] `"short_name": "QuizMe"` → `"KwizMe"`
  - [ ] `"description": "Generate practice quizzes from your learning materials using AI"` (review for branding)

### 4.2 Icon Generator (Optional)

- [ ] **Update icon generator** (`/public/generate-icons.html`):
  - [ ] `<title>QuizMe Icon Generator</title>` → `<title>KwizMe Icon Generator</title>`
  - [ ] `<h1>🎨 QuizMe Icon Generator</h1>` → `<h1>🎨 KwizMe Icon Generator</h1>`

### 4.3 Testing PWA

- [ ] **Test PWA installation**:
  - [ ] Test "Add to Home Screen" functionality
  - [ ] Verify app name appears correctly
  - [ ] Test PWA launch from home screen
- [ ] **Test app icon** (should remain unchanged)

**✅ Phase 4 Checkpoint**: PWA updated, installation works correctly

---

## 🖥️ Phase 5: User Interface & Content

**Goal**: Update all user-facing text and interface elements
**Risk Level**: ⚠️ MEDIUM
**Time**: ~1 day

### 5.1 Core Layout & Meta

- [ ] **App layout** (`/app/layout.tsx`):
  - [ ] Update meta title: `'QuizMe - AI Quiz Generator'` → `'KwizMe - AI Quiz Generator'`
  - [ ] Update Apple web app title references

### 5.2 Main Pages

- [ ] **Home page** (`/app/page.tsx`):
  - [ ] Update PWA tip: "📱 Install QuizMe as a Progressive Web App (PWA)..." → "📱 Install KwizMe as a Progressive Web App (PWA)..."

- [ ] **Offline page** (`/app/offline/page.tsx`):
  - [ ] "Redirecting you to QuizMe..." → "Redirecting you to KwizMe..."
  - [ ] "QuizMe needs an internet connection..." → "KwizMe needs an internet connection..."

### 5.3 Authentication Pages

- [ ] **Login page** (`/app/auth/login/page.tsx`):
  - [ ] "Sign in to your QuizMe account" → "Sign in to your KwizMe account"

- [ ] **Signup page** (`/app/auth/signup/page.tsx`):
  - [ ] "Join QuizMe and start learning" → "Join KwizMe and start learning"

### 5.4 Support & Info Pages

- [ ] **Support page** (`/app/support/page.tsx`):
  - [ ] Update all FAQ references to "QuizMe" → "KwizMe"

- [ ] **Status page** (`/app/status/page.tsx`):
  - [ ] "QuizMe System Status" → "KwizMe System Status"

### 5.5 Components

- [ ] **Top Banner** (`/components/TopBanner.tsx`):
  - [ ] Update brand display name
  - [ ] Check `handleQuizMeClick()` function name (consider renaming)

- [ ] **Side Panel** (`/components/SidePanel.tsx`):
  - [ ] "Welcome to QuizMe" → "Welcome to KwizMe"

- [ ] **Generating Quiz** (`/components/GeneratingQuiz.tsx`):
  - [ ] Update GitHub issues URL comment

### 5.6 API Routes

- [ ] **Feedback API** (`/app/api/submit-feedback/route.ts`):
  - [ ] Update title: `'🎯 New QuizMe Feedback'` → `'🎯 New KwizMe Feedback'`
  - [ ] Update thank you message references

**✅ Phase 5 Checkpoint**: All user-facing content updated

---

## ⚖️ Phase 6: Legal & Compliance

**Goal**: Update legal documents and terms
**Risk Level**: ⚠️ MEDIUM (May require legal review)
**Time**: ~0.5 day

### 6.1 Legal Documents

- [ ] **Terms of Service** (`/app/legal/terms/page.tsx`):
  - [ ] Update all "QuizMe" references
  - [ ] **⚠️ LEGAL REVIEW RECOMMENDED**: Verify legal entity references are correct

- [ ] **Privacy Policy** (`/app/legal/privacy/page.tsx`):
  - [ ] Update all "QuizMe" references
  - [ ] **⚠️ LEGAL REVIEW RECOMMENDED**: Verify privacy policy accuracy

### 6.2 Code Comments & Utilities

- [ ] **Database types** (`/lib/db/types.ts`):
  - [ ] Update comment: "Type definitions for QuizMe database entities"

- [ ] **Seed data** (`/lib/db/seed-data.ts`):
  - [ ] Update institution fields: `'QuizMe'` → `'KwizMe'` (3 instances)

- [ ] **Analytics** (`/lib/analytics.ts`):
  - [ ] Update comment: "Analytics utility functions for QuizMe"

- [ ] **Monitoring** (`/lib/monitoring.ts`):
  - [ ] Update comment: "Monitoring and logging utilities for QuizMe application"

- [ ] **Quiz storage** (`/lib/supabase/quiz-storage.ts`):
  - [ ] Update function name references and comments

**✅ Phase 6 Checkpoint**: Legal documents updated (pending legal review)

---

## 🚀 Phase 7: Deployment & External Services

**Goal**: Update external integrations and deployment configuration
**Risk Level**: ⚠️ MEDIUM
**Time**: ~0.5 day

### 7.1 Pre-Deployment Testing

- [ ] **Full application test**:
  - [ ] Test all major user flows
  - [ ] Verify PWA functionality
  - [ ] Test offline mode
  - [ ] Verify local storage migration
  - [ ] Test theme persistence
  - [ ] Test feedback form

### 7.2 Vercel Deployment

- [ ] **Update Vercel project** (if keeping same deployment):
  - [ ] Update project name in Vercel dashboard
  - [ ] Update environment variables
  - [ ] Test deployment

### 7.3 External Service Updates

- [ ] **Sentry Configuration**:
  - [ ] Create new Sentry organization: `kwizme-app` (or rename existing)
  - [ ] Create new project: `kwizme-app`
  - [ ] Update environment variables
  - [ ] Test error reporting

- [ ] **Discord Webhook** (if applicable):
  - [ ] Update webhook channel names
  - [ ] Test feedback form integration

### 7.4 Domain & URL Updates

- [ ] **Update documentation** with new URLs
- [ ] **Update support templates** with new URLs
- [ ] **Verify all internal links** work correctly

**✅ Phase 7 Checkpoint**: Deployment successful, external services updated

---

## 📝 Phase 8: Post-Deployment Verification

**Goal**: Verify everything works correctly in production
**Time**: ~0.5 day

### 8.1 Production Testing

- [ ] **Core functionality**:
  - [ ] User authentication works
  - [ ] Quiz generation works
  - [ ] Data persistence works
  - [ ] Theme switching works

- [ ] **PWA functionality**:
  - [ ] App installs correctly
  - [ ] Offline mode works
  - [ ] Service worker updates correctly

- [ ] **User experience**:
  - [ ] All text displays "KwizMe"
  - [ ] No remaining "QuizMe" references visible
  - [ ] Legal pages accessible
  - [ ] Support pages work

### 8.2 Monitoring & Analytics

- [ ] **Verify monitoring**:
  - [ ] Sentry errors reporting correctly
  - [ ] Analytics tracking works
  - [ ] Performance monitoring active

### 8.3 User Communication

- [ ] **Announce rebrand** (if applicable):
  - [ ] Social media updates
  - [ ] User notifications
  - [ ] Support documentation updates

**✅ Final Checkpoint**: Rebranding complete and verified

---

## 🚨 Emergency Rollback Plan

If critical issues arise during deployment:

### Immediate Rollback Steps

1. **Revert Git changes**:
   ```bash
   git reset --hard HEAD~1  # or specific commit
   git push --force-with-lease
   ```

2. **Restore service worker cache**:
   - Revert `/public/sw.js`
   - Clear browser cache on affected devices

3. **Database rollback**:
   - Restore from backup if database changes made
   - Restore localStorage keys if needed

4. **External services**:
   - Revert Sentry configuration
   - Restore original URLs in documentation

---

## 📊 Progress Tracking

### Overall Progress: 10% Complete

- [x] Phase 1: Documentation & Low-Risk Changes (15% - Section 1.1 Complete)
- [ ] Phase 2: Configuration & Build Setup (0%)
- [ ] Phase 3: Critical Technical Infrastructure (0%)
- [ ] Phase 4: Progressive Web App (PWA) (0%)
- [ ] Phase 5: User Interface & Content (0%)
- [ ] Phase 6: Legal & Compliance (0%)
- [ ] Phase 7: Deployment & External Services (0%)
- [ ] Phase 8: Post-Deployment Verification (0%)

---

## 📋 File Change Summary

### Files Requiring Updates (93 total)

**Configuration (5 files)**:
- `package.json`, `package-lock.json`, `.env.example`, `next.config.js`, `manifest.json`

**Core Application (20+ files)**:
- Layout, pages, components, API routes, utilities

**Database & Schema (10+ files)**:
- SQL files, migration scripts, documentation

**Documentation (30+ files)**:
- README, support docs, archive, planning documents

**PWA & Assets (3 files)**:
- Service worker, manifest, icon generator

---

## 🎯 Success Criteria

- [ ] **No "QuizMe" references visible** to end users
- [ ] **PWA installs correctly** with new name
- [ ] **User data preserved** (themes, preferences)
- [ ] **All functionality works** as before
- [ ] **Legal documents updated** and reviewed
- [ ] **External services configured** correctly
- [ ] **Documentation reflects** new brand
- [ ] **Deployment successful** without issues

---

**Ready to begin Phase 1?** ✅

*This plan serves as our complete roadmap. We'll execute each phase methodically, testing thoroughly before proceeding to the next phase.*
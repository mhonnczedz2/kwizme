# QuizMe - Immediate Action Plan

**Created:** 2025-12-01
**Focus:** UX Improvements (Quick Wins)
**Estimated Total Time:** 8-12 hours

---

## 🎯 Overview

This plan focuses on high-impact UX improvements that can be implemented quickly:
1. **Question/Option Randomization** - UI already exists, implement logic
2. **Review Mistakes Mode** - High learning value feature
3. **Better Loading States** - Improved user feedback during operations
4. **Keyboard Shortcuts** - Power user feature
5. **Dark Mode** - High user demand

---

## ✅ Task 1: Question/Option Randomization
**Priority:** HIGH | **Time:** 2-3 hours | **Impact:** HIGH

### Current State
- UI toggles already exist in `QuizConfigModal.tsx`
- Options saved to session config but not implemented
- Database schema supports it

### Implementation Steps
1. **Implement shuffle logic** (`lib/utils/shuffle.ts`)
   - Fisher-Yates shuffle algorithm
   - TypeScript generic function

2. **Update QuizDisplay component**
   - Read `randomize_questions` and `randomize_options` from config
   - Shuffle questions array on mount if enabled
   - Shuffle options for each question if enabled
   - Track original order for answer validation

3. **Test scenarios**
   - Enable question randomization only
   - Enable option randomization only
   - Enable both
   - Verify answer checking still works correctly

### Files to Modify
- `components/QuizDisplay.tsx`
- Create: `lib/utils/shuffle.ts`

### Success Criteria
- [ ] Questions appear in random order when enabled
- [ ] Options appear in random order when enabled
- [ ] Answer validation still works correctly
- [ ] Original correct answer index tracked properly

---

## ✅ Task 2: Review Mistakes Mode
**Priority:** HIGH | **Time:** 3-4 hours | **Impact:** VERY HIGH

### Current State
- `answer_records` table tracks which questions were wrong
- No UI to filter to incorrect answers
- High learning value for students

### Implementation Steps
1. **Add database query function** (`lib/db/session-storage.ts`)
   ```typescript
   export async function getIncorrectQuestionsForQuiz(
     quizId: string,
     userId?: string
   ): Promise<number[]>
   ```
   - Query `answer_records` where `is_correct = false`
   - Return array of `question_id`s
   - Join with `review_sessions` to filter by quiz

2. **Add "Review Mistakes" button**
   - In `QuizHistory.tsx` - next to "Take Quiz Again"
   - In `QuizResults.tsx` - after completing quiz
   - Disabled if user got 100% (no mistakes)

3. **Create ReviewMistakesMode component**
   - Similar to `QuizDisplay.tsx`
   - Only shows questions user got wrong previously
   - Shows explanation by default
   - Can't skip questions
   - Tracks as separate session type

4. **Update QuizConfigModal**
   - Add "Review Mistakes" preset
   - Config: explanations ON, timer OFF, show hint automatically

### Files to Modify
- `lib/db/session-storage.ts` (new query function)
- `components/QuizHistory.tsx` (add button)
- `components/QuizResults.tsx` (add button)
- `components/QuizDisplay.tsx` (support mistake-only mode)

### Success Criteria
- [ ] Button appears in Quiz History and Results
- [ ] Only shows previously incorrect questions
- [ ] Tracks as separate session
- [ ] Disabled when no mistakes exist

---

## ✅ Task 3: Better Loading States
**Priority:** MEDIUM | **Time:** 2-3 hours | **Impact:** HIGH

### Current State
- Generic "Generating quiz..." message
- No progress indication
- No visual feedback during operations

### Implementation Steps
1. **Create LoadingSkeleton component** (`components/LoadingSkeleton.tsx`)
   - Pulsing skeleton cards for quiz browser
   - Question skeleton for quiz display
   - Generic skeleton for other components

2. **Enhance GeneratingQuiz component** (`components/GeneratingQuiz.tsx`)
   - Multi-step progress indicator:
     - "📄 Reading your PDF..." (0-2 sec)
     - "🧠 Analyzing content..." (2-5 sec)
     - "❓ Generating questions..." (5-8 sec)
     - "✨ Almost ready..." (8-10 sec)
   - Progress bar that fills
   - Estimated time remaining

3. **Add error states with recovery**
   - Create `ErrorBoundary` component
   - Friendly error messages:
     - PDF parse error → "Couldn't read PDF. Try another file?"
     - API error → "AI service unavailable. Try again in a moment."
     - Rate limit → "Too many quizzes! Wait 5 minutes."
   - "Retry" button for recoverable errors
   - "Report Issue" link for unrecoverable errors

4. **Add loading states to all async operations**
   - Quiz generation (already done)
   - Quiz browser loading
   - Session history loading
   - Delete operations (show spinner)

### Files to Create
- `components/LoadingSkeleton.tsx`
- `components/ErrorBoundary.tsx`

### Files to Modify
- `components/GeneratingQuiz.tsx`
- `components/QuizBrowser.tsx`
- `components/QuizHistory.tsx`
- `app/page.tsx`

### Success Criteria
- [ ] Skeleton screens show during loading
- [ ] Multi-step progress during generation
- [ ] Friendly error messages with recovery options
- [ ] Spinner shows during delete operations

---

## ✅ Task 4: Keyboard Shortcuts
**Priority:** MEDIUM | **Time:** 2-3 hours | **Impact:** MEDIUM-HIGH

### Current State
- Mouse/tap only interaction
- No keyboard navigation
- Power users expect shortcuts

### Implementation Steps
1. **Create useKeyboardShortcuts hook** (`lib/hooks/useKeyboardShortcuts.ts`)
   ```typescript
   export function useKeyboardShortcuts(handlers: {
     onSelect?: (index: number) => void
     onSubmit?: () => void
     onNext?: () => void
     onHint?: () => void
   })
   ```

2. **Implement shortcuts in QuizDisplay**
   - `1`, `2`, `3`, `4` → Select answer option
   - `Enter` → Submit answer (after selection)
   - `n` or `→` → Next question (after feedback)
   - `h` → Show hint
   - `?` → Show shortcuts help overlay

3. **Add shortcuts help overlay**
   - Press `?` to show
   - Modal with all shortcuts listed
   - Click outside or `Esc` to close
   - Subtle `?` icon in corner as hint

4. **Add shortcuts to other screens**
   - Quiz Browser: `←` `→` to navigate pages
   - Results: `r` to retake, `h` for home

### Files to Create
- `lib/hooks/useKeyboardShortcuts.ts`
- `components/KeyboardShortcutsHelp.tsx`

### Files to Modify
- `components/QuizDisplay.tsx`
- `components/QuizBrowser.tsx`
- `components/QuizResults.tsx`

### Success Criteria
- [ ] Number keys 1-4 select answers
- [ ] Enter submits, N goes to next
- [ ] H shows hint
- [ ] ? shows help overlay
- [ ] Shortcuts work across all screens

---

## ✅ Task 5: Dark Mode
**Priority:** MEDIUM | **Time:** 2-3 hours | **Impact:** HIGH

### Current State
- Light mode only
- High user demand for dark mode
- Tailwind has built-in dark mode support

### Implementation Steps
1. **Enable dark mode in Tailwind config** (`tailwind.config.ts`)
   ```typescript
   module.exports = {
     darkMode: 'class', // Use class-based dark mode
     // ... rest of config
   }
   ```

2. **Create theme context** (`lib/contexts/ThemeContext.tsx`)
   ```typescript
   export function ThemeProvider({ children })
   export function useTheme()
   ```
   - Track theme state ('light' | 'dark' | 'system')
   - Persist to localStorage
   - Apply class to `<html>` element

3. **Add dark mode styles to all components**
   - Use Tailwind's `dark:` prefix
   - Update backgrounds: `bg-white dark:bg-gray-900`
   - Update text: `text-gray-900 dark:text-gray-100`
   - Update borders: `border-gray-200 dark:border-gray-700`
   - Ensure sufficient contrast in both modes

4. **Add theme toggle in header**
   - Moon/sun icon button
   - 3 options: Light, Dark, System
   - Shows current mode
   - Smooth transition between modes

5. **Components to update**
   - All buttons (hover states)
   - Quiz cards
   - Answer options (selected, correct, incorrect states)
   - Modals and overlays
   - Form inputs

### Files to Create
- `lib/contexts/ThemeContext.tsx`
- `components/ThemeToggle.tsx`

### Files to Modify
- `tailwind.config.ts`
- `app/layout.tsx` (wrap with ThemeProvider)
- ALL component files (add dark: classes)

### Success Criteria
- [ ] Toggle switches between light/dark/system
- [ ] Preference persists across sessions
- [ ] All components readable in both modes
- [ ] Sufficient contrast in all states
- [ ] Smooth transition animation

---

## 📋 Implementation Order

### Phase 1: Quick Wins (Day 1-2)
1. Question/Option Randomization (2-3 hours)
2. Better Loading States (2-3 hours)

### Phase 2: High Value (Day 3-4)
3. Review Mistakes Mode (3-4 hours)
4. Keyboard Shortcuts (2-3 hours)

### Phase 3: Polish (Day 5)
5. Dark Mode (2-3 hours)

---

## 🧪 Testing Checklist

After each task, verify:

### Randomization
- [ ] Enable in config, verify questions shuffled
- [ ] Verify options shuffled
- [ ] Answer validation still correct
- [ ] Works with all session modes

### Review Mistakes
- [ ] Take quiz, get some wrong
- [ ] "Review Mistakes" button appears
- [ ] Only shows incorrect questions
- [ ] Works with quiz from history

### Loading States
- [ ] Skeleton shows while loading quiz browser
- [ ] Progress steps during generation
- [ ] Error messages helpful
- [ ] Retry button works

### Keyboard Shortcuts
- [ ] Number keys select answers
- [ ] Enter submits
- [ ] N goes to next
- [ ] ? shows help
- [ ] Works on all screens

### Dark Mode
- [ ] Toggle switches themes
- [ ] Persists across reload
- [ ] All text readable
- [ ] All buttons work
- [ ] Forms visible

---

## 🚀 Next Steps After Completion

Once these 5 tasks are done:

1. **Deploy to Vercel** (1-2 hours)
   - Production build test
   - Environment variables
   - Deploy and test live

2. **Beta User Testing** (ongoing)
   - Share with 10-20 users
   - Collect feedback
   - Iterate

3. **Phase 2 Features** (future)
   - PWA offline support
   - Export to PDF
   - Analytics dashboard
   - Spaced repetition

---

## 📝 Notes

- All tasks are non-breaking (no schema changes)
- Can be implemented independently
- Focus on user experience improvements
- High impact-to-effort ratio
- Sets foundation for Phase 2 features

---

**Status:** Ready to implement
**Next Action:** Start with Task 1 (Randomization)

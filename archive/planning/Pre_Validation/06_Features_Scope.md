# QuizMe: Features & Scope

---

## MVP Feature List

### Must-Have Features (Week 1-6)

#### 1. PDF Upload
**Description**: Allow users to upload PDF files for quiz generation

**Requirements**:
- ✅ Drag-and-drop interface
- ✅ Click-to-browse file picker
- ✅ File size validation (max 10MB)
- ✅ Format validation (.pdf extension only)
- ✅ Visual feedback (file name, size display)
- ✅ Error messages for invalid files

**Acceptance Criteria**:
- User can drag PDF onto upload zone
- User can click to open file browser
- Files >10MB are rejected with clear error
- Non-PDF files are rejected
- File details (name, size) displayed after selection
- Upload process takes <2 seconds

**Tech Implementation**:
- React `react-dropzone` library
- Client-side file validation
- FormData API for file upload

---

#### 2. Quiz Generation
**Description**: Process PDF and generate quiz using AI

**Requirements**:
- ✅ Extract text from PDF (pdf-parse)
- ✅ Send text to LLM API (Gemini or GPT-4o-mini)
- ✅ Parse JSON response
- ✅ Validate quiz structure
- ✅ Save to client-side database (SQL.js)
- ✅ Generate 10-15 questions per quiz

**Acceptance Criteria**:
- PDF text successfully extracted in <10 seconds
- LLM returns valid JSON response
- All questions have 4 options, 1 correct answer, explanation
- Quiz stored in local database
- Generation completes in 30-60 seconds
- Error handling for API failures

**Tech Implementation**:
- Vercel serverless function: `/api/generate-quiz`
- pdf-parse library for text extraction
- OpenAI or Google AI SDK for LLM API
- JSON schema validation
- SQL.js for local storage

---

#### 3. Quiz Interface
**Description**: Display questions and collect user answers

**Requirements**:
- ✅ Display one question at a time
- ✅ Multiple choice selection (radio buttons)
- ✅ Submit button (disabled until answer selected)
- ✅ Immediate feedback with explanation
- ✅ Visual indicators (correct = green, incorrect = red)
- ✅ Progress tracking (X of Y completed)
- ✅ Next button to advance

**Acceptance Criteria**:
- Only one question visible per screen
- User can select one of 4 options
- Submit button enables after selection
- Feedback shows within 100ms of submission
- Correct/incorrect clearly indicated with color
- Progress bar updates after each question
- Keyboard navigation supported (Enter to submit)

**Tech Implementation**:
- React component: `QuizQuestion`
- State management: React Context
- CSS: TailwindCSS for styling
- LocalStorage: Save progress after each answer

---

#### 4. Results Screen
**Description**: Show quiz performance summary

**Requirements**:
- ✅ Display score (correct/total and percentage)
- ✅ Visual progress bar
- ✅ Breakdown by question (optional view)
- ✅ Action buttons:
  - Review incorrect questions
  - Retake quiz
  - Generate new quiz
- ✅ Time spent tracking (optional)

**Acceptance Criteria**:
- Score calculated correctly (13/15 = 87%)
- Progress bar visually represents score
- User can review missed questions
- User can retake same quiz
- Results persist in history
- Screen loads instantly (<500ms)

**Tech Implementation**:
- React component: `QuizResults`
- Calculate score from answer_records table
- Query SQL.js for detailed breakdown

---

#### 5. Local Storage System
**Description**: Store quiz data on user's device

**Requirements**:
- ✅ SQL.js database setup
- ✅ Database schema (quizzes, questions, sessions, answers)
- ✅ localStorage persistence
- ✅ Auto-save after each action
- ✅ Database initialization on first visit

**Acceptance Criteria**:
- Database persists across browser sessions
- Quizzes accessible without internet (after generation)
- Data survives page refresh
- No data sent to external servers (except generation)
- Database can store 100+ quizzes (5-10MB limit)

**Tech Implementation**:
- SQL.js library (WebAssembly SQLite)
- localStorage API for persistence
- IndexedDB fallback (future)

---

#### 6. Quiz History Page
**Description**: List all previously generated quizzes

**Requirements**:
- ✅ Display all past quizzes
- ✅ Show quiz metadata (filename, topic, date)
- ✅ Show best score per quiz
- ✅ Buttons to retake or view results
- ✅ Sorted by recency (most recent first)

**Acceptance Criteria**:
- All quizzes loaded from database
- List sorted by creation date (newest first)
- Each quiz shows filename, topic, best score
- User can click to retake or view past results
- Empty state: "No quizzes yet. Generate your first!"
- Search functionality (nice-to-have)

**Tech Implementation**:
- React component: `QuizHistory`
- Query SQL.js: `SELECT * FROM quizzes ORDER BY created_at DESC`
- Join with review_sessions for best score

---

#### 7. PWA Basics
**Description**: Make app installable and work offline

**Requirements**:
- ✅ Web App Manifest (metadata, icons)
- ✅ Service Worker (basic offline support)
- ✅ Responsive design (mobile + desktop)
- ✅ Install prompt (browser-native)
- ✅ App icons (192x192, 512x512)

**Acceptance Criteria**:
- App installable on iOS and Android
- App shell loads offline
- Cached quizzes work without internet
- Cannot generate quizzes offline (clear message)
- Responsive layout (mobile-first, works on tablets/desktop)

**Tech Implementation**:
- Next.js PWA plugin or manual setup
- manifest.json with app metadata
- Service worker for cache-first strategy
- Icons generated with PWA Asset Generator

---

### Nice-to-Have Features (Week 7-8)

#### 8. Export Quiz to JSON
**Description**: Allow users to download quiz data

**Requirements**:
- 🔲 Export quiz as JSON file
- 🔲 Include all questions, answers, explanations
- 🔲 One-click download button
- 🔲 Filename: `quiz_[topic]_[date].json`

**Why Nice-to-Have**: Not critical for validation, but useful for data portability

**Tech Implementation**:
- JSON.stringify(quiz data)
- Create Blob and download link
- Trigger browser download

---

#### 9. Import Previously Exported Quiz
**Description**: Re-import quiz from JSON file

**Requirements**:
- 🔲 Upload JSON file
- 🔲 Validate format
- 🔲 Import into database
- 🔲 Make available in quiz history

**Why Nice-to-Have**: Edge case (browser cache cleared), low priority

**Tech Implementation**:
- File upload input (accept .json)
- JSON.parse and validate
- INSERT into SQL.js database

---

#### 10. Search Past Quizzes
**Description**: Filter quiz history by keyword

**Requirements**:
- 🔲 Search bar on history page
- 🔲 Filter by filename or topic
- 🔲 Real-time filtering (as user types)
- 🔲 Case-insensitive search

**Why Nice-to-Have**: Useful for power users with 10+ quizzes, not critical for MVP

**Tech Implementation**:
- React state for search query
- SQL query: `WHERE filename LIKE '%search%' OR topic LIKE '%search%'`

---

#### 11. Dark Mode Toggle
**Description**: Switch between light and dark themes

**Requirements**:
- 🔲 Toggle button (moon/sun icon)
- 🔲 Persist preference in localStorage
- 🔲 Apply dark theme across all pages
- 🔲 Follow system preference by default

**Why Nice-to-Have**: Nice UX improvement, but not critical for validation

**Tech Implementation**:
- TailwindCSS dark mode utilities
- React Context for theme state
- localStorage for persistence
- `prefers-color-scheme` media query

---

#### 12. Keyboard Shortcuts
**Description**: Navigate quiz with keyboard

**Requirements**:
- 🔲 1-4: Select options A-D
- 🔲 Enter: Submit answer / Next question
- 🔲 Esc: Exit quiz (with confirmation)
- 🔲 Arrow keys: Navigate between questions (review mode)

**Why Nice-to-Have**: Power user feature, improves efficiency, not essential

**Tech Implementation**:
- Add event listeners for keydown events
- Map keys to actions
- Show shortcuts hint at bottom of quiz page

---

## Explicitly Out of Scope (MVP)

### User Accounts & Authentication
**Why Excluded**: Adds complexity, not needed to validate core hypothesis

**When to Add**: Phase 3 (Month 5-6) when monetizing

**Impact**: No cross-device sync, no cloud backup

---

### Payment Integration
**Why Excluded**: Validate product first, monetize later

**When to Add**: Phase 3 (Month 5-6) after 100+ active users

**Impact**: $0 revenue during MVP phase

---

### Email Notifications
**Why Excluded**: Requires email service, adds complexity

**When to Add**: Phase 2 (Month 3-4) for retention features

**Impact**: No automated study reminders

---

### Spaced Repetition Algorithm
**Why Excluded**: Complex to implement, not core to initial value prop

**When to Add**: Phase 2 (Month 3-4) for retention

**Impact**: Users must manually decide when to retake quizzes

---

### Social Features (Sharing, Leaderboards)
**Why Excluded**: Not core to solo studying, adds complexity

**When to Add**: Phase 4 (Month 7-12) if users request

**Impact**: Can't share quizzes with friends or compare scores

---

### Analytics Dashboard
**Why Excluded**: Over-engineered for MVP, use simple metrics

**When to Add**: Phase 2 (Month 3-4) for retention insights

**Impact**: No detailed performance trends, just basic stats

---

### Admin Panel
**Why Excluded**: No need for admin features in MVP

**When to Add**: Phase 3 (Month 5-6) when managing users/payments

**Impact**: Manual database inspection for debugging

---

### Mobile Native Apps
**Why Excluded**: PWA is faster to build and test

**When to Add**: Phase 4 (Month 7-12) if PWA has limitations

**Impact**: Users install PWA instead of App Store app

---

### Multi-Language Support
**Why Excluded**: English-only for MVP, adds translation complexity

**When to Add**: Phase 5 (Year 2) for international expansion

**Impact**: English-only target audience

---

### Image/Diagram Recognition
**Why Excluded**: Text-only PDFs for MVP, OCR is complex

**When to Add**: Phase 4 (Month 7-12) if users request

**Impact**: Can't generate questions about images/charts

---

### Voice Input/Output
**Why Excluded**: Not core to studying, adds complexity

**When to Add**: Never (unless accessibility need arises)

**Impact**: No hands-free quiz taking

---

## Feature Prioritization Matrix

### High Impact, Low Effort (Build First)
- ✅ PDF upload
- ✅ Quiz generation
- ✅ Quiz interface
- ✅ Results screen
- ✅ Local storage

### High Impact, High Effort (Build Second)
- ✅ Quiz history page
- ✅ PWA basics
- 🔲 Spaced repetition (Phase 2)

### Low Impact, Low Effort (Nice-to-Have)
- 🔲 Export quiz
- 🔲 Dark mode
- 🔲 Keyboard shortcuts

### Low Impact, High Effort (Don't Build)
- ❌ Mobile native apps (use PWA)
- ❌ Image recognition
- ❌ Voice input

---

## Acceptance Criteria Summary

### Definition of Done (MVP Launch-Ready)

A feature is considered "done" when:
1. ✅ Code is written and passes tests
2. ✅ Works on mobile and desktop
3. ✅ Error handling implemented
4. ✅ Accessible (keyboard navigation, screen reader)
5. ✅ Documented (inline code comments)
6. ✅ Tested by 2+ beta users

### Definition of "MVP Complete"

MVP is complete when:
1. ✅ All Must-Have features implemented
2. ✅ 10 beta testers successfully generate and complete quizzes
3. ✅ Average quiz quality rating ≥ 4.0/5.0
4. ✅ No critical bugs in production
5. ✅ App installable as PWA on iOS and Android
6. ✅ Deployed to production (Vercel)

---

## Feature Rollout Plan

### Week 1-2: Backend + Quiz Generation
- [ ] PDF upload API endpoint
- [ ] Text extraction (pdf-parse)
- [ ] LLM integration (Gemini or GPT-4o-mini)
- [ ] JSON validation

### Week 3-4: Frontend + Quiz Interface
- [ ] Upload component (drag-drop)
- [ ] Quiz component (questions, options, feedback)
- [ ] Results component
- [ ] SQL.js database setup
- [ ] State management (Context API)

### Week 5-6: Polish + PWA
- [ ] Quiz history page
- [ ] Mobile responsive design
- [ ] Error handling (all edge cases)
- [ ] PWA manifest + service worker
- [ ] Loading states and progress indicators

### Week 7-8: Beta + Iteration
- [ ] Deploy to production
- [ ] Recruit beta testers
- [ ] Collect feedback
- [ ] Fix bugs
- [ ] Iterate on quality issues
- [ ] Optional: Add nice-to-have features if time permits

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28

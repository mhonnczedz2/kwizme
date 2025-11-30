# QuizMe: Pre-Validation MVP Plan

**AI-Powered Quiz Generator - Personal Study Tool**

---

## Executive Summary

**Goal**: Build a minimal viable product to validate the core hypothesis: *"Students want an AI tool that automatically generates practice quizzes from their PDF study materials."*

**Timeline**: 6-8 weeks
**Budget**: $0-50 initial setup + $10-50/month operating costs
**Success Metric**: 100 users complete at least one quiz, 40%+ return for a second quiz

---

## 1. Product Definition

### Core Value Proposition

*"Upload your textbook PDF, get a personalized practice quiz in 60 seconds. Study smarter, not harder."*

### What We're Building

A **personal study tool** that:
- Accepts PDF uploads (up to 10 pages or 10MB)
- Generates 10-20 multiple choice questions using AI
- Provides immediate feedback with explanations
- Tracks quiz results locally on user's device
- Works offline after quiz generation

### What We're NOT Building (Yet)

❌ User accounts or authentication
❌ Cloud sync or multi-device support
❌ Social features or sharing
❌ Spaced repetition algorithms
❌ Advanced analytics or dashboards
❌ Mobile native apps

---

## 2. Technical Architecture

### Client-Side PWA Architecture

```
[User Browser - PWA]
    ↓
[SQL.js - Client-Side SQLite]
    ↓
[localStorage/IndexedDB]
    ↓ (only when generating new quiz)
[Vercel Serverless Function] → [OpenAI/Gemini API]
    ↓
[Returns JSON to browser]
    ↓
[Saved locally in SQL.js]
```

### Technology Stack

**Frontend:**
- React 18 + Next.js 14 (App Router)
- TailwindCSS (mobile-first responsive design)
- TypeScript
- SQL.js (client-side SQLite database)

**Backend:**
- Vercel Serverless Functions (quiz generation only)
- OpenAI GPT-4o-mini or Google Gemini API

**Client-Side Storage:**
- SQL.js (quiz data, session history)
- localStorage (database persistence)
- IndexedDB (offline quiz cache)

**Deployment:**
- Vercel (free tier)
- Custom domain (optional, ~$12/year)

### Database Schema (Client-Side SQL.js)

```sql
-- Core quiz storage
CREATE TABLE quizzes (
    quiz_id TEXT PRIMARY KEY,
    pdf_filename TEXT NOT NULL,
    topic TEXT,
    difficulty_level TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON array: ["A", "B", "C", "D"]
    correct_answer_index INTEGER NOT NULL,
    explanation TEXT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);

-- Session history tracking (local analytics)
CREATE TABLE review_sessions (
    session_id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER,
    score_percentage REAL,
    time_spent_seconds INTEGER,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);

-- Individual answer tracking
CREATE TABLE answer_records (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES review_sessions(session_id),
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
);

-- Performance indexes
CREATE INDEX idx_sessions_quiz ON review_sessions(quiz_id);
CREATE INDEX idx_sessions_completed ON review_sessions(completed_at);
CREATE INDEX idx_answers_session ON answer_records(session_id);
CREATE INDEX idx_answers_question ON answer_records(question_id);
```

---

## 3. AI Integration

### LLM Provider Choice

**Recommended**: Google Gemini 1.5 Flash (fastest, cheapest) or OpenAI GPT-4o-mini

**Rationale**:
- Gemini Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens
- GPT-4o-mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- Both handle PDF text → MCQ generation well
- Start with one, easy to swap later

### Prompt Structure

```python
base_prompt = """
You are an expert educator creating multiple choice questions for students.
Generate questions that test comprehension, application, and analysis.

From this document, generate {num_questions} multiple choice questions.

Each question must have:
- 1 correct answer
- 3 plausible distractors (wrong answers that seem reasonable)
- Brief explanation of why the answer is correct

Return ONLY valid JSON in this exact format:
{
  "quiz_id": "generated-uuid",
  "pdf_filename": "{filename}",
  "topic": "extracted topic",
  "difficulty_level": "medium",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer_index": 1,
      "explanation": "Explanation here.",
      "difficulty": "medium"
    }
  ]
}

Document text:
{pdf_text}
"""
```

### Quality Checks

**Automated Validation:**
1. JSON schema validation (all required fields present)
2. Uniqueness check (no duplicate questions)
3. Answer distribution check (correct answer not always option A)
4. Length validation (question between 10-200 characters)

**Fallback Strategy:**
- If generation fails, retry once
- If retry fails, show clear error message
- No template fallback (keep MVP simple)

---

## 4. User Flow

### Step 1: Upload (< 30 seconds)

1. User visits app (quizme.vercel.app or custom domain)
2. Sees simple upload interface: "Drop PDF here or click to browse"
3. Selects PDF file (client-side validation: max 10MB, .pdf extension)
4. Optional: "Describe this document" text input (helps AI context)

### Step 2: Processing (30-60 seconds)

1. Show loading screen: "Generating your quiz..."
2. Progress indicator with stages:
   - "📄 Reading PDF..." (5s)
   - "🤖 Creating questions..." (25s)
   - "✓ Ready!" (1s)
3. Client receives JSON response, saves to SQL.js database

### Step 3: Taking Quiz (5-10 minutes)

1. One question per screen (mobile-friendly)
2. 4 multiple choice options (A/B/C/D)
3. User selects answer → immediate feedback:
   - ✓ "Correct! [Explanation]" (green)
   - ✗ "Incorrect. The answer is B. [Explanation]" (red)
4. "Next" button appears after answer selected
5. Progress indicator: "Question 3 of 15"

### Step 4: Results (< 1 minute)

1. Score summary: "You scored 13/15 (87%)" with visual progress bar
2. Breakdown by question (optional review)
3. Action buttons:
   - "Review Incorrect Questions"
   - "Generate New Quiz"
   - "Export Quiz" (download JSON)

---

## 5. MVP Features

### Must-Have (Week 1-6)

✅ **PDF Upload**
- Drag-and-drop interface
- File size validation (max 10MB)
- Format validation (.pdf only)

✅ **Quiz Generation**
- Extract text from PDF
- Send to LLM API
- Parse JSON response
- Save to client-side database

✅ **Quiz Interface**
- Display questions one at a time
- Multiple choice selection
- Immediate feedback with explanation
- Progress tracking (X of Y completed)

✅ **Results Screen**
- Score percentage
- Correct/incorrect breakdown
- Option to review questions

✅ **Local Storage**
- SQL.js database setup
- localStorage persistence
- Quiz history page (list past quizzes)

✅ **PWA Basics**
- Installable (web app manifest)
- Responsive design (mobile + desktop)
- Basic offline support (cached quizzes)

### Nice-to-Have (Week 7-8, if time permits)

🔲 Export quiz to JSON file
🔲 Import previously exported quiz
🔲 Search past quizzes by filename
🔲 Dark mode toggle
🔲 Keyboard shortcuts (Enter to submit, Arrow keys to navigate)

### Explicitly Out of Scope

❌ User accounts / authentication
❌ Payment integration
❌ Email notifications
❌ Spaced repetition
❌ Social features
❌ Analytics dashboard
❌ Admin panel

---

## 6. Development Timeline

### Week 1-2: Backend Foundation

**Serverless Function Setup:**
- Initialize Vercel project
- Create `/api/generate-quiz` serverless function
- Integrate PDF text extraction (pdf-parse or pdf.js)
- Integrate LLM API (OpenAI or Gemini)
- Test with sample PDFs

**Deliverable**: Working API endpoint that accepts PDF, returns quiz JSON

### Week 3-4: Frontend Core

**React/Next.js Setup:**
- Initialize Next.js 14 project with TypeScript
- Set up TailwindCSS
- Create pages:
  - Home (upload interface)
  - Loading (generation progress)
  - Quiz (question display)
  - Results (score summary)
- Implement SQL.js database
- Build quiz state management (React Context + useReducer)

**Deliverable**: Working quiz flow (upload → questions → results)

### Week 5-6: Polish & PWA

**Refinements:**
- Mobile responsive design (test on real devices)
- Error handling (upload failures, API errors)
- Loading states and progress indicators
- Quiz history page
- localStorage persistence (database backup)

**PWA Setup:**
- Web App Manifest
- Service Worker (basic offline support)
- Install prompt
- Icons and branding

**Deliverable**: Fully functional MVP ready for beta testing

### Week 7-8: Beta Testing & Iteration

**Beta Launch:**
- Deploy to Vercel
- Recruit 20 beta testers (friends, Reddit, Discord)
- Collect feedback via Google Form
- Track usage metrics (manually check database if needed)

**Iterations:**
- Fix critical bugs
- Improve question quality based on feedback
- Adjust prompt engineering
- UI/UX tweaks

**Deliverable**: Production-ready MVP with validated product-market fit signals

---

## 7. Cost Structure

### Development Costs

| Item | Cost |
|------|------|
| Developer time (200-250 hours @ $0 if solo founder) | $0 |
| Designer (contract, optional) | $500-1000 |
| Domain name (optional) | $12/year |
| **Total Initial Investment** | **$12-1012** |

### Monthly Operating Costs (at 100 users)

| Service | Cost |
|---------|------|
| Vercel Hosting (free tier) | $0/month |
| Vercel Serverless Functions (free tier: 100GB-hours) | $0/month |
| LLM API (100 quizzes/month × $0.03) | $3/month |
| Email (SendGrid free tier, optional) | $0/month |
| Analytics (PostHog free tier, optional) | $0/month |
| **Total Monthly Cost** | **$3-10/month** |

### Scaling Costs (at 1,000 users)

| Service | Cost |
|---------|------|
| Vercel Hosting | $0/month |
| Vercel Serverless Functions | $0-20/month (may exceed free tier) |
| LLM API (1,000 quizzes/month × $0.03) | $30/month |
| Email (SendGrid paid tier) | $15/month |
| Analytics (PostHog paid tier) | $0-20/month |
| **Total Monthly Cost** | **$45-85/month** |

---

## 8. Success Metrics

### North Star Metric

**Quizzes Completed per Week** - measures core value delivery

### Key Metrics to Track

**Acquisition:**
- Total signups (unique visitors who upload a PDF)
- Source attribution (if possible)

**Activation:**
- % of uploads that complete generation successfully
- % of generated quizzes that are started
- Average time from upload to first question answered

**Engagement:**
- Quiz completion rate (% who finish vs. abandon)
- Questions answered per quiz (are people engaging?)
- Repeat usage (% who generate 2+ quizzes)

**Quality:**
- Average questions answered correctly (too easy/hard?)
- User feedback on question quality (manual collection)

**Retention:**
- Day 1 return rate
- Day 7 return rate
- Day 30 return rate (if timeline allows)

### Manual Tracking (Pre-Analytics)

Since we have no user accounts, track via:
- Vercel serverless function logs (quiz generation count)
- Optional: Anonymous quiz completion pings (quiz_id only)
- User feedback form (Google Form)
- Beta tester interviews (1:1 calls)

---

## 9. Validation Criteria

### Success Signals (Go to Phase 2)

✅ **100+ quizzes generated** (proves people try it)
✅ **40%+ quiz completion rate** (proves engagement)
✅ **20%+ repeat usage** (proves retention potential)
✅ **4.0/5.0+ avg quality rating** (proves AI is good enough)
✅ **Positive feedback from 70%+ of beta testers**

### Failure Signals (Pivot or Kill)

❌ <50 quizzes generated in 4 weeks (no demand)
❌ <20% quiz completion rate (boring/broken)
❌ <10% repeat usage (no retention)
❌ <3.0/5.0 quality rating (AI too poor)
❌ Majority negative feedback (UX or concept broken)

---

## 10. Risks & Mitigation

### Risk 1: Poor Question Quality
**Impact**: Critical (destroys trust)
**Probability**: Medium
**Mitigation**:
- Extensive prompt engineering with test PDFs
- Beta test with real students (get feedback early)
- "Report bad question" button on every question
- Manual review of first 100 generated quizzes

### Risk 2: LLM API Cost Overruns
**Impact**: High (budget blow-up)
**Probability**: Low (controlled by usage)
**Mitigation**:
- Hard monthly spend cap ($100 for MVP phase)
- Rate limiting (5 generations per day per device)
- Monitor cost-per-quiz daily
- Switch to cheaper model if needed (Gemini Flash)

### Risk 3: PDF Parsing Failures
**Impact**: Medium (user frustration)
**Probability**: Medium (exotic formats)
**Mitigation**:
- Support only major PDF creators initially
- Clear error message: "This PDF format is not supported. Try exporting from Google Docs."
- Test with diverse sample PDFs during development
- Log failures to understand patterns

### Risk 4: No Traction (People Don't Use It)
**Impact**: Critical (invalidates hypothesis)
**Probability**: Medium (most MVPs fail)
**Mitigation**:
- Launch in student communities (Reddit r/college, r/studying)
- Offer free lifetime access to first 100 users
- Personal outreach to students (friends, networks)
- Simple value prop: "60 seconds from PDF to quiz"
- If no traction after 4 weeks → conduct user interviews to understand why

---

## 11. Launch Strategy

### Beta Launch (Week 7)

**Target Audience:**
- College students (age 18-24)
- STEM majors (most likely to have dense PDFs)
- Active studiers (Reddit r/GetStudying community)

**Distribution Channels:**
1. **Reddit** (primary):
   - Post in r/college, r/studying, r/GetStudying
   - "I built a tool to auto-generate practice quizzes from PDFs"
   - Offer free lifetime access to first 100 users
   - Include demo video (Loom, 60 seconds)

2. **Personal Network**:
   - Message 20 friends who are students or know students
   - Ask for feedback + referrals

3. **Product Hunt** (optional, Week 8):
   - Launch only if beta gets positive feedback
   - Goal: Top 10 product of the day

**Success Goal**: 20 beta testers, 10 who complete 2+ quizzes

---

## 12. Post-MVP Roadmap (If Validation Succeeds)

### Phase 2: Retention Features (Month 3-4)
- Spaced repetition (review weak areas)
- Email reminders (quiz yourself before midterms!)
- Daily streak counter
- Export to Anki/CSV

### Phase 3: Monetization (Month 5-6)
- Freemium model:
  - Free: 5 quizzes/month
  - Premium ($4.99/month): Unlimited quizzes
- Stripe integration
- First 50 paying users

### Phase 4: Growth (Month 7-12)
- Cloud sync (multi-device support)
- User accounts (prerequisite for sync)
- Referral program
- Mobile app (React Native or PWA optimization)

### Phase 5: B2B (Year 2)
- University site licenses
- Teacher dashboards
- Bulk upload features

---

## 13. Tech Stack Justification

### Why Client-Side Architecture?

✅ **Zero infrastructure costs** ($0/month vs. $50-200/month for servers)
✅ **Instant feedback** (quiz logic runs on device, <50ms response)
✅ **Offline-capable** (works without internet after generation)
✅ **Privacy-first** (data never leaves device)
✅ **Simpler to build** (no backend API, auth, or database management)

**Trade-offs:**
- ❌ No cross-device sync (acceptable for MVP)
- ❌ Data lost if browser cache cleared (export feature mitigates)
- ❌ No social features possible (not needed for validation)

### Why Next.js + Vercel?

✅ **Fast development** (built-in routing, API routes, TypeScript support)
✅ **Free hosting** (Vercel free tier handles 100GB bandwidth)
✅ **Zero config deployment** (git push → live in 30 seconds)
✅ **Serverless functions** (no backend server management)
✅ **Automatic HTTPS** (SSL included)

### Why SQL.js (Client-Side SQLite)?

✅ **Relational data model** (quizzes, questions, sessions naturally relational)
✅ **SQL queries** (easier than IndexedDB API)
✅ **Export/import** (SQLite files portable across devices)
✅ **Zero hosting costs** (runs in browser)
✅ **Mature technology** (SQLite battle-tested since 2000)

**Alternative considered**: IndexedDB directly
**Rejected because**: IndexedDB API more complex, harder to query

---

## 14. Implementation Checklist

### Week 1-2: Backend

- [ ] Initialize Vercel project
- [ ] Create `/api/generate-quiz` endpoint
- [ ] Integrate PDF parser (pdf-parse library)
- [ ] Integrate LLM API (OpenAI or Gemini)
- [ ] Test with 10 sample PDFs
- [ ] Implement retry logic for API failures
- [ ] Add JSON validation for responses

### Week 3-4: Frontend

- [ ] Initialize Next.js project
- [ ] Set up TailwindCSS + TypeScript
- [ ] Create page structure (Home, Quiz, Results)
- [ ] Build upload component (drag-drop + validation)
- [ ] Implement SQL.js database
- [ ] Create quiz state management (Context API)
- [ ] Build question display component
- [ ] Build results screen
- [ ] Connect frontend to backend API

### Week 5-6: Polish & PWA

- [ ] Mobile responsive design (test on iPhone + Android)
- [ ] Error handling (all edge cases)
- [ ] Loading states (spinners, progress bars)
- [ ] Quiz history page (list past quizzes)
- [ ] localStorage persistence (auto-save database)
- [ ] Create web app manifest
- [ ] Set up service worker (offline support)
- [ ] Design app icons (192x192, 512x512)
- [ ] Test install flow on mobile devices

### Week 7-8: Beta Testing

- [ ] Deploy to Vercel production
- [ ] Set up custom domain (optional)
- [ ] Create feedback form (Google Form)
- [ ] Write Reddit post with demo video
- [ ] Recruit 20 beta testers
- [ ] Monitor usage (serverless logs)
- [ ] Conduct 5 user interviews
- [ ] Fix critical bugs
- [ ] Iterate on question quality
- [ ] Document lessons learned

---

## 15. Key Decisions & Assumptions

### Decisions Made

1. **Client-side database**: SQL.js over cloud PostgreSQL (cost + simplicity)
2. **No user accounts**: Local-only data (validate first, add accounts later)
3. **PWA over native apps**: Web-first for faster iteration
4. **Freemium later**: Launch free, add monetization after validation
5. **Single LLM provider**: Start with Gemini or GPT-4o-mini, don't over-engineer switching
6. **Manual analytics**: No analytics platform initially, track via logs + feedback

### Assumptions to Validate

1. **Students will upload PDFs**: (They might prefer photos of notes, or typed notes)
2. **AI quality is good enough**: (Questions might be too easy/hard/irrelevant)
3. **MCQs are desired format**: (Students might prefer flashcards or short answer)
4. **60-second generation is acceptable**: (Might need to be faster)
5. **No accounts is OK**: (Students might want to save across devices)

### Known Limitations

- **Local-only storage**: Quizzes tied to single device/browser
- **No sharing**: Can't send quiz to friend or study group
- **PDF text only**: Doesn't handle images, diagrams, or handwriting
- **English only**: No multi-language support initially
- **10MB limit**: Can't process full textbooks (just chapters)

---

## 16. Next Steps (Immediate Actions)

### This Week

1. **Set up development environment**:
   - Install Node.js, create Next.js project
   - Set up Vercel account
   - Get LLM API key (OpenAI or Google AI Studio)

2. **Build proof-of-concept**:
   - Test PDF text extraction with sample file
   - Test LLM question generation with extracted text
   - Verify JSON parsing works

3. **Create wireframes**:
   - Sketch upload screen, quiz screen, results screen
   - Get feedback from 2-3 potential users
   - Iterate on design

### Next Week

4. **Start coding**:
   - Build serverless function first (backend)
   - Then build frontend components
   - Test integration between frontend + backend

5. **Set up feedback mechanism**:
   - Create Google Form for beta feedback
   - Prepare user interview questions
   - Draft Reddit launch post

---

## 17. Open Questions (To Resolve During Development)

1. **How many questions per quiz?**
   - Hypothesis: 10-15 questions (10 min quiz)
   - Test: Ask beta users if they want more/less

2. **Should we allow retaking quizzes?**
   - Pro: Good for studying (spaced repetition)
   - Con: Might game the system (memorize answers)
   - Decision: Allow retakes (it's a study tool, not a test)

3. **What's the minimum viable PDF size?**
   - Too short: Not enough content for good questions
   - Hypothesis: At least 2 pages, 500 words
   - Test: Try generating from 1-page PDFs, see quality

4. **Should we show explanations before or after answering?**
   - Option A: Immediate (right after selecting answer)
   - Option B: At the end (after completing all questions)
   - Decision: Immediate (better for learning/retention)

5. **How to handle generation failures gracefully?**
   - Show error message: "Quiz generation failed. Try again?"
   - Offer retry button
   - Log errors for debugging
   - If repeated failures → suggest user email support

---

## 18. Resources & References

### Documentation
- Next.js Docs: https://nextjs.org/docs
- SQL.js GitHub: https://github.com/sql-js/sql.js
- Vercel Serverless Functions: https://vercel.com/docs/functions
- OpenAI API: https://platform.openai.com/docs
- Google Gemini API: https://ai.google.dev/docs

### Tools
- Figma (wireframes): https://figma.com
- Loom (demo videos): https://loom.com
- PostHog (analytics, later): https://posthog.com

### Communities
- r/college: https://reddit.com/r/college
- r/studying: https://reddit.com/r/studying
- r/GetStudying: https://reddit.com/r/GetStudying
- Indie Hackers: https://indiehackers.com

---

## Document Version

**Version**: 1.0
**Last Updated**: 2025-11-28
**Owner**: QuizMe Founding Team

**Next Review**: After Week 8 (beta testing complete)

---

*This is a living document. Update as you build, learn, and validate assumptions with real users.*

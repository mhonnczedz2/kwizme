# QuizMe: Product Definition

---

## Core Value Proposition

*"Upload your textbook PDF, get a personalized practice quiz in 60 seconds. Study smarter, not harder."*

---

## What We're Building

A **personal study tool** that:

### Must-Have Features
- ✅ Accepts PDF uploads (up to 10 pages or 10MB)
- ✅ Generates 20-50 multiple choice questions using AI
- ✅ Provides immediate feedback with explanations
- ✅ Tracks quiz results locally on user's device
- ✅ Works offline after quiz generation

### Key Characteristics
- **Fast**: Quiz ready in 60 seconds or less
- **Simple**: One-click upload, no configuration needed
- **Private**: All quiz data stays on user's device
- **Educational**: Each answer includes an explanation
- **Accessible**: Mobile-friendly PWA, works on any device

---

## What We're NOT Building (Yet)

### Explicitly Out of Scope for MVP

❌ **User accounts or authentication**
- Rationale: Adds complexity, not needed to validate core hypothesis
- Future: Add in Phase 3 when monetizing

❌ **Cloud sync or multi-device support**
- Rationale: Requires backend infrastructure and user accounts
- Future: Add in Phase 4 for growth

❌ **Social features or sharing**
- Rationale: Not core to learning value
- Future: Consider in Phase 4 if users request

❌ **Spaced repetition algorithms**
- Rationale: Complex to implement, validate basic quiz first
- Future: Add in Phase 2 for retention

❌ **Advanced analytics or dashboards**
- Rationale: Over-engineered for MVP
- Future: Simple stats in Phase 2

❌ **Mobile native apps**
- Rationale: PWA is faster to build and test
- Future: Consider if PWA has limitations

---

## User Personas

### Primary Persona: "Cramming Chris"
- **Age**: 20, sophomore college student
- **Major**: Biology (pre-med)
- **Pain Point**: Has 100-page lecture PDFs, needs to self-test before exams
- **Motivation**: "I learn best by testing myself, but making flashcards takes forever"
- **Success**: Can generate a practice quiz from this week's lecture in under 2 minutes

### Secondary Persona: "Organized Olivia"
- **Age**: 22, senior engineering student
- **Major**: Computer Science
- **Pain Point**: Wants structured study routine, needs variety in practice questions
- **Motivation**: "I want to make sure I understand every concept before the final"
- **Success**: Can track her quiz performance over time to identify weak areas

---

## Use Cases

### Use Case 1: Pre-Exam Quiz Generation
1. **Context**: Student has midterm in 3 days, has 10 PDF lecture files
2. **Action**: Upload each PDF, generate quiz for each lecture
3. **Outcome**: 10 quizzes (150 questions total) ready to practice
4. **Success**: Student feels confident about material coverage

### Use Case 2: Post-Lecture Comprehension Check
1. **Context**: Just finished watching lecture, professor posted PDF slides
2. **Action**: Download PDF, upload to QuizMe, take quiz immediately
3. **Outcome**: Identify gaps in understanding while material is fresh
4. **Success**: Student knows what to review before next class

### Use Case 3: Textbook Chapter Review
1. **Context**: Need to study Chapter 5 from digital textbook
2. **Action**: Extract 10 pages as PDF, generate quiz
3. **Outcome**: Practice quiz with 15 questions covering chapter concepts
4. **Success**: Student can review weak areas in textbook

---

## Feature Prioritization

### Must-Have (Blocks Launch)
1. PDF upload and validation
2. AI quiz generation (20-50 questions)
3. Quiz-taking interface (one question at a time)
4. Immediate feedback with explanations
5. Score summary screen
6. Local storage (SQL.js database)

### Should-Have (Launch Week 6)
1. Quiz history page (list past quizzes)
2. Progress tracking during quiz
3. Responsive mobile design
4. Basic error handling

### Nice-to-Have (Week 7-8 if time permits)
1. Export quiz to JSON
2. Search past quizzes
3. Dark mode
4. Keyboard shortcuts

### Won't-Have (Post-MVP)
1. User accounts
2. Cloud sync
3. Spaced repetition
4. Analytics dashboard
5. Social features

---

## User Journey Map

### Stage 1: Discovery
- **Touchpoint**: Reddit post, friend referral
- **User Goal**: Understand what tool does
- **Emotion**: Curious, skeptical
- **Action**: Visit landing page

### Stage 2: First Use
- **Touchpoint**: Upload PDF, wait for generation
- **User Goal**: See if it actually works
- **Emotion**: Impatient, hopeful
- **Action**: Upload sample PDF

### Stage 3: Quiz Taking
- **Touchpoint**: Answer questions, see feedback
- **User Goal**: Test knowledge, learn
- **Emotion**: Engaged, challenged
- **Action**: Complete quiz

### Stage 4: Results Review
- **Touchpoint**: See score, review mistakes
- **User Goal**: Understand performance
- **Emotion**: Satisfied or motivated to improve
- **Action**: Decide to generate another quiz

### Stage 5: Repeat Use
- **Touchpoint**: Return to app days later
- **User Goal**: Study for upcoming exam
- **Emotion**: Confident, efficient
- **Action**: Upload new PDF or retake old quiz

---

## Assumptions to Validate

### Core Assumptions
1. **Students will upload PDFs** (vs. preferring photos, typed notes, or URLs)
2. **AI quality is good enough** (questions are relevant, accurate, appropriately difficult)
3. **MCQs are desired format** (vs. flashcards, short answer, or essay prompts)
4. **60-second generation is acceptable** (vs. needing instant results)
5. **No accounts is OK** (vs. wanting to save across devices)

### How We'll Validate
- Beta tester interviews (qualitative)
- Usage metrics (quantitative)
- Feedback form (mixed)
- A/B tests on question format (future)

---

## Known Limitations

### Technical Limitations
- **Local-only storage**: Quizzes tied to single device/browser
- **PDF text only**: Doesn't handle images, diagrams, or handwriting
- **10MB limit**: Can't process full textbooks (just chapters)
- **English only**: No multi-language support initially

### Acceptance Criteria
- These limitations are acceptable for MVP
- Will revisit based on user feedback
- Clear error messages when limitations hit

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28

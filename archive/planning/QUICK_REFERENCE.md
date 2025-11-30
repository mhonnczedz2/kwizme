# QuizMe - Quick Reference

## 🏃 Quick Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code

# Git
git status           # Check status
git add .            # Stage all changes
git commit -m "..."  # Commit with message
git log --oneline    # View commit history
```

## 📁 Project Structure Quick Map

```
quizme/
├── app/
│   ├── page.tsx                    # ✅ Main app with state machine
│   ├── layout.tsx                  # ✅ Root layout
│   └── api/
│       └── generate-quiz/route.ts  # ✅ Quiz generation endpoint
├── components/
│   ├── FileUploadZone.tsx          # ✅ Upload + metadata
│   ├── QuizDisplay.tsx             # ✅ Quiz taking interface
│   ├── QuizResults.tsx             # ✅ Results screen
│   ├── QuizConfigModal.tsx         # ✅ Session configuration
│   ├── QuizHistory.tsx             # ✅ Past attempts
│   ├── QuizBrowser.tsx             # ✅ Browse/filter quizzes
│   └── QuizReview.tsx              # ✅ Review past sessions
└── lib/
    ├── pdf-parser.ts               # ✅ PDF text extraction
    ├── llm-client.ts               # ✅ Gemini API integration
    └── db/
        ├── schema.ts               # ✅ Database schema
        ├── client.ts               # ✅ Database utilities
        ├── quiz-storage.ts         # ✅ Quiz CRUD
        ├── session-storage.ts      # ✅ Session management
        └── types.ts                # ✅ TypeScript types
```

## 🗄️ Database Schema Quick Reference

```sql
-- Quiz metadata
quizzes (quiz_id, pdf_filename, institution, program, course,
         course_code, topic, difficulty_level, created_at)

-- Questions with text-based answers
questions (question_id, quiz_id, question_text, options,
           correct_answer, explanation, hint, difficulty)

-- Session tracking with configuration
review_sessions (session_id, quiz_id, started_at, completed_at,
                 correct_answers, score_percentage,
                 quick_submit, show_explanation, time_limit_seconds,
                 randomize_options, randomize_questions, preset_name)

-- Individual answer records
answer_records (record_id, session_id, question_id,
                selected_answer_index, is_correct, time_spent_seconds)
```

## 🎯 Current Status

**✅ MVP Complete - Week 7-8 (Polish & PWA)**
- ✅ All core features implemented
- ✅ Quiz generation pipeline working
- ✅ Quiz browser with filtering
- ✅ Quiz history with session tracking
- ✅ Session configuration system
- ✅ Organizational metadata
- ⏳ PWA features (service worker, offline) - optional

## 🔑 Key Types

```typescript
// Quiz entity
interface Quiz {
  quiz_id: string;
  pdf_filename: string;
  topic: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  institution?: string;
  course?: string;
  // ... more fields
}

// Question with text-based answer
interface Question {
  question_id: number;
  quiz_id: string;
  question_text: string;
  options: string;  // JSON array: ["A", "B", "C", "D"]
  correct_answer: string;  // "B" (actual text, not index!)
  explanation: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Session configuration
interface SessionConfig {
  quick_submit: boolean;
  show_explanation: boolean;
  time_limit_seconds: number | null;
  randomize_options: boolean;
  randomize_questions: boolean;
  num_questions_selected: number;
  preset_name: 'learn' | 'test' | 'fast_learn' | 'custom';
}

// Session presets
const PRESETS = {
  learn: { quick_submit: false, show_explanation: true, time_limit_seconds: 120 },
  test: { quick_submit: false, show_explanation: false, time_limit_seconds: 300 },
  fast_learn: { quick_submit: true, show_explanation: false, time_limit_seconds: 20 }
};
```

## 🛠️ Common Operations

### Initialize Database
```typescript
import { initDatabase } from '@/lib/db/client';

const db = await initDatabase();
// ✨ Created new database
// ✅ Database schema initialized
// 💾 Database saved to localStorage
```

### Query Data
```typescript
import { executeQuery } from '@/lib/db/client';

const quizzes = executeQuery<Quiz>(db,
  'SELECT * FROM quizzes ORDER BY created_at DESC'
);
```

### Insert Data
```typescript
import { executeUpdate } from '@/lib/db/client';

executeUpdate(db,
  'INSERT INTO quizzes (quiz_id, pdf_filename, topic, difficulty_level, created_at) VALUES (?, ?, ?, ?, ?)',
  ['quiz-123', 'sample.pdf', 'Biology', 'medium', new Date().toISOString()]
);
```

### Check Answer
```typescript
function checkAnswer(question: Question, userAnswer: string): boolean {
  return userAnswer === question.correct_answer;
}

// Text-based matching enables future randomization:
// Shuffle options array freely, matching by text always works!
```

## 📋 Week 7-8 Priorities (Current)

**PWA Implementation** (Optional):
- Service worker for offline support
- Web app manifest
- Cache-first strategy for static assets
- Offline quiz-taking

**Beta Testing Preparation**:
- Comprehensive cross-browser testing
- Mobile responsiveness verification
- Performance optimization
- User documentation
- Beta user onboarding flow

**Optional Enhancements**:
- Question/option randomization
- Per-question timer with countdown
- Dark mode
- Keyboard shortcuts
- Export quiz to PDF

## 📖 Documentation

- **README.md** - Quick start and overview
- **DEVELOPMENT.md** - Detailed implementation guide
- **Pre_Validation/** - Complete planning docs
  - `03_Technical_Architecture.md` - Full database schema
  - `04_AI_Integration.md` - LLM prompts and validation
  - `05_User_Flow_UX.md` - UI wireframes and flows
  - `12_Implementation_Checklist.md` - Day-by-day tasks

## 🐛 Debug Checklist

**Quiz not generating?**
1. Check API endpoint: `curl -X POST http://localhost:3000/api/generate-quiz`
2. Check API key in `.env.local`
3. Check browser console for errors
4. Check server logs in terminal

**Database not persisting?**
1. Open DevTools → Application → Local Storage
2. Look for `quizme-db` key
3. Check console for "💾 Database saved" message

**PDF upload failing?**
1. Check file is .pdf format
2. Check file size < 10MB
3. Check browser console for validation errors

## 🎨 UI Components Checklist

- [x] FileUploadZone (drag & drop + metadata)
- [x] QuizDisplay (question display + answers)
- [x] QuizResults (final score + grade)
- [x] QuizConfigModal (presets + customization)
- [x] QuizHistory (past attempts + scores)
- [x] QuizBrowser (browse/filter quizzes)
- [x] QuizReview (review past sessions)
- [ ] Timer (countdown per question) - Phase 2
- [ ] DarkModeToggle - Phase 2

## 🚀 Launch Checklist

- [x] All core features working
- [x] Mobile responsive
- [x] Test on multiple browsers
- [x] Database persistence working
- [x] Quiz generation working
- [x] Session tracking working
- [ ] PWA manifest and service worker (optional)
- [ ] Deploy to Vercel
- [ ] Collect beta user feedback

---

**Current Status**: MVP Complete (~90%) - Ready for Deployment! 🚀

**Need help?** Check DEVELOPMENT.md or STATUS_REPORT.md for detailed info.

**Ready to deploy?** See README.md for deployment guide.

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
│   ├── page.tsx                    # Home page
│   ├── layout.tsx                  # Root layout
│   ├── quiz/[quiz_id]/page.tsx    # 🚧 TODO: Quiz interface
│   └── api/
│       └── generate-quiz/route.ts  # 🚧 TODO: Quiz generation
├── components/
│   ├── FileUploadZone.tsx          # ✅ DONE
│   ├── QuizQuestion.tsx            # 🚧 TODO
│   └── AnswerFeedback.tsx          # 🚧 TODO
└── lib/
    └── db/
        ├── schema.ts               # ✅ Database schema
        ├── client.ts               # ✅ Database utilities
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

**✅ Week 1-2: COMPLETED**
- Next.js + TypeScript + TailwindCSS setup
- SQL.js database with full schema
- File upload component
- API route structure
- Landing page UI

**🚧 Week 3-4: IN PROGRESS**
- [ ] PDF text extraction (pdf-parse)
- [ ] LLM API integration (Gemini/GPT)
- [ ] Quiz display interface
- [ ] Answer validation logic
- [ ] Database operations

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

## 📋 Week 3-4 Priorities

**Day 1-2**: PDF Extraction
- Install: `npm install pdf-parse`
- Create: `lib/pdf-parser.ts`
- Test with sample PDF

**Day 3-5**: LLM Integration
- Get API key (Gemini or OpenAI)
- Create: `.env.local` with API key
- Create: `lib/llm-client.ts`
- Implement: `/api/generate-quiz/route.ts`

**Day 6-8**: Quiz Interface
- Create: `app/quiz/[quiz_id]/page.tsx`
- Create: `components/QuizQuestion.tsx`
- Create: `components/AnswerFeedback.tsx`
- Implement answer checking

**Day 9-10**: Database Operations
- Create: `lib/db/operations.ts`
- Save generated quizzes
- Track sessions and answers
- Implement quiz history

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

- [x] FileUploadZone (drag & drop)
- [ ] QuizQuestion (display question + options)
- [ ] AnswerFeedback (show result + explanation)
- [ ] QuizProgress (Question X of Y)
- [ ] QuizResults (final score)
- [ ] ConfigurationModal (presets)
- [ ] QuizHistory (past attempts)
- [ ] Timer (countdown)

## 🚀 Launch Checklist (Week 7-8)

- [ ] All core features working
- [ ] PWA manifest and service worker
- [ ] Mobile responsive
- [ ] Test on 3+ browsers
- [ ] Deploy to Vercel
- [ ] Collect beta user feedback

---

**Need help?** Check DEVELOPMENT.md for detailed guides.

**Stuck?** Review documentation in Pre_Validation/ folder.

**Ready?** Start with `npm run dev` and tackle Week 3-4 tasks!

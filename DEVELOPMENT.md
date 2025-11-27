# QuizMe Development Guide

## 🎯 Current Status

**Phase**: Week 1-2 (Project Setup) ✅ COMPLETED

**What's Done**:
- ✅ Next.js project scaffolding
- ✅ SQL.js database with complete schema
- ✅ TypeScript types for all entities
- ✅ File upload component (drag & drop)
- ✅ API route structure
- ✅ Landing page UI

**What's Next**: Week 3-4 (Core Features)

---

## 🚀 Getting Started

### 1. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

You should see:
- Landing page with "QuizMe" header
- File upload zone (drag & drop)
- Three feature cards (Upload, AI Generation, Practice)
- "Under Development" badge

### 2. Verify Database Setup

Open browser console (F12) and run:

```javascript
// Initialize database
const { initDatabase } = await import('/lib/db/client');
const db = await initDatabase();

// Should see in console:
// ✨ Created new database
// ✅ Database schema initialized
// 💾 Database saved to localStorage

// Verify tables exist
const tables = db.exec(`
  SELECT name FROM sqlite_master
  WHERE type='table'
`);
console.log('Tables:', tables);
// Should show: quizzes, questions, review_sessions, answer_records
```

### 3. Test File Upload

1. Drag a PDF onto the upload zone
2. Should see green checkmark and filename
3. Check browser console for validation messages

---

## 📋 Week 3-4 Implementation Plan

### Day 1-2: PDF Text Extraction

**Goal**: Extract text from uploaded PDF files

**Tasks**:
1. Install pdf-parse library:
   ```bash
   npm install pdf-parse
   ```

2. Create PDF parsing utility (`lib/pdf-parser.ts`):
   ```typescript
   import pdfParse from 'pdf-parse';

   export async function extractTextFromPDF(file: File): Promise<string> {
     const arrayBuffer = await file.arrayBuffer();
     const data = await pdfParse(Buffer.from(arrayBuffer));
     return data.text;
   }
   ```

3. Test with sample PDF:
   ```typescript
   const text = await extractTextFromPDF(myPdfFile);
   console.log('Extracted text:', text.substring(0, 500));
   ```

**Acceptance Criteria**:
- Can extract text from PDF files
- Handles multi-page PDFs
- Returns clean text without formatting artifacts

---

### Day 3-5: LLM API Integration

**Goal**: Generate quizzes using Gemini Flash or GPT-4o-mini

**Tasks**:
1. Get API key:
   - **Gemini Flash**: https://makersuite.google.com/app/apikey
   - **GPT-4o-mini**: https://platform.openai.com/api-keys

2. Create `.env.local` file:
   ```bash
   # Choose one:
   GEMINI_API_KEY=your_key_here
   # OR
   OPENAI_API_KEY=your_key_here
   ```

3. Create LLM client (`lib/llm-client.ts`):
   ```typescript
   export async function generateQuiz(
     pdfText: string,
     numQuestions: number,
     difficulty: string
   ): Promise<QuizGenerationResponse> {
     // See 04_AI_Integration.md for prompt template
     const prompt = buildPrompt(pdfText, numQuestions, difficulty);

     const response = await fetch(LLM_API_URL, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
       },
       body: JSON.stringify({ prompt }),
     });

     return await response.json();
   }
   ```

4. Implement `/api/generate-quiz/route.ts`:
   - Extract PDF text
   - Call LLM API
   - Validate response schema
   - Return quiz JSON

**Acceptance Criteria**:
- API endpoint returns valid quiz JSON
- Questions have text-based answers
- Includes explanations and hints
- Per-question difficulty ratings

**Test Command**:
```bash
curl -X POST http://localhost:3000/api/generate-quiz \
  -F "pdf_file=@sample.pdf" \
  -F "num_questions=15" \
  -F "difficulty=medium"
```

---

### Day 6-8: Quiz Display Interface

**Goal**: Display quiz questions and handle user answers

**Tasks**:
1. Create quiz page (`app/quiz/[quiz_id]/page.tsx`):
   - Load quiz from database
   - Display questions one at a time
   - Show progress (Question 3 of 15)

2. Create QuizQuestion component:
   ```typescript
   interface QuizQuestionProps {
     question: Question;
     onSubmit: (selectedIndex: number) => void;
   }
   ```

3. Implement answer checking:
   ```typescript
   function checkAnswer(question: Question, userAnswer: string): boolean {
     return userAnswer === question.correct_answer;
   }
   ```

4. Show feedback after answer:
   - ✓ Correct! (green)
   - ✗ Incorrect (red) + show correct answer
   - Display explanation
   - [Next Question] button

**Acceptance Criteria**:
- Can display quiz questions
- User can select answer and submit
- Shows correct/incorrect feedback
- Displays explanation after each question
- Tracks progress through quiz

---

### Day 9-10: Database Integration

**Goal**: Save quizzes and sessions to local database

**Tasks**:
1. Create database operations (`lib/db/operations.ts`):
   ```typescript
   export function saveQuiz(quiz: QuizGenerationResponse): void {
     // Insert into quizzes table
     // Insert questions
     // Save database to localStorage
   }

   export function createSession(quizId: string, config: SessionConfig): string {
     // Generate session_id
     // Insert into review_sessions
     // Return session_id
   }

   export function recordAnswer(
     sessionId: string,
     questionId: number,
     selectedIndex: number,
     isCorrect: boolean
   ): void {
     // Insert into answer_records
   }
   ```

2. Update upload flow:
   - Upload PDF → Generate quiz → Save to database → Navigate to quiz

3. Implement quiz history:
   - Query review_sessions
   - Display past attempts with scores
   - Allow retaking quizzes

**Acceptance Criteria**:
- Generated quizzes saved to database
- Can reload quiz from database
- Session tracking works
- Quiz history displays correctly

---

## 🎨 UI Components to Build

### Priority 1 (Week 3-4)
- [x] FileUploadZone
- [ ] QuizQuestion (question display + answer selection)
- [ ] AnswerFeedback (correct/incorrect + explanation)
- [ ] QuizProgress (Question X of Y)
- [ ] QuizResults (final score summary)

### Priority 2 (Week 5-6)
- [ ] ConfigurationModal (Learn/Test/Fast Learn presets)
- [ ] QuizHistory (past attempts)
- [ ] QuizCollection (browse saved quizzes)
- [ ] Timer (countdown per question)

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Upload & Generation**:
- [ ] Can upload PDF file
- [ ] File validation works (PDF only, 10MB max)
- [ ] Quiz generation succeeds
- [ ] Returns 15 questions with correct schema

**Quiz Taking**:
- [ ] Questions display correctly
- [ ] Can select and submit answers
- [ ] Feedback shows correctly
- [ ] Explanation displays
- [ ] Progress through all questions

**Database**:
- [ ] Quiz saved to localStorage
- [ ] Can reload page and access quiz
- [ ] Session history persists
- [ ] Answer records saved

### Test Data

Create sample PDF with test content:
```
# Cell Biology Chapter 5

The mitochondria is known as the powerhouse of the cell because
it generates ATP through cellular respiration.

DNA replication occurs during the S phase of the cell cycle.
The process is semi-conservative, meaning each new DNA molecule
contains one original strand and one newly synthesized strand.
```

Expected: 15 questions about mitochondria, DNA, cell cycle, etc.

---

## 🐛 Common Issues & Solutions

### Issue 1: SQL.js not loading
**Error**: `Cannot find module 'sql.js'`

**Solution**:
```bash
npm install sql.js
```

Make sure `next.config.js` has webpack config for SQL.js.

### Issue 2: localStorage not persisting
**Error**: Database resets on page reload

**Solution**:
Check browser console for errors. Verify `saveDatabase()` is called after inserts.

Test manually:
```javascript
localStorage.getItem('quizme-db'); // Should return long JSON string
```

### Issue 3: PDF parsing fails
**Error**: `Failed to extract text from PDF`

**Solution**:
- Check PDF is not encrypted/password-protected
- Try different PDF (some formats not supported)
- Check pdf-parse is installed: `npm list pdf-parse`

### Issue 4: LLM API rate limit
**Error**: `429 Too Many Requests`

**Solution**:
- Implement client-side rate limiting (see `04_AI_Integration.md`)
- Cache responses for testing (don't call API repeatedly)
- Use lower `num_questions` during development

---

## 📚 Key Files Reference

### Database
- `/lib/db/schema.ts` - Complete schema definition
- `/lib/db/client.ts` - Database initialization and utilities
- `/lib/db/types.ts` - TypeScript interfaces

### Components
- `/components/FileUploadZone.tsx` - PDF upload
- Create: `/components/QuizQuestion.tsx` - Question display
- Create: `/components/AnswerFeedback.tsx` - Result feedback

### API Routes
- `/app/api/generate-quiz/route.ts` - Quiz generation endpoint

### Pages
- `/app/page.tsx` - Landing page with upload
- Create: `/app/quiz/[quiz_id]/page.tsx` - Quiz taking interface
- Create: `/app/history/page.tsx` - Quiz history

### Documentation
- `/Pre_Validation/03_Technical_Architecture.md` - Database schema
- `/Pre_Validation/04_AI_Integration.md` - LLM prompts and validation
- `/Pre_Validation/05_User_Flow_UX.md` - Complete UX wireframes
- `/Pre_Validation/12_Implementation_Checklist.md` - Day-by-day tasks

---

## 🎯 Week 3-4 Success Criteria

By end of Week 4, you should have:

✅ **PDF to Quiz Pipeline**:
- Upload PDF → Extract text → Generate quiz → Save to DB

✅ **Quiz Taking Flow**:
- Load quiz → Answer questions → See feedback → View results

✅ **Local Storage**:
- Quizzes persist in browser
- Can reload and retake quizzes
- Session history saved

✅ **UI Components**:
- File upload zone
- Quiz question display
- Answer feedback screen
- Results summary

**Demo Flow**:
1. Upload sample PDF
2. Wait for generation (~5 seconds)
3. Click "Take Quiz"
4. Answer all 15 questions
5. See final score
6. Reload page
7. Quiz still available in history

---

## 💡 Development Tips

### 1. Start Simple
Don't implement all features at once. Get basic flow working first:
- PDF upload → Mock quiz → Display questions → Check answers

Then add:
- Real LLM generation
- Database persistence
- Configuration options

### 2. Use Sample Data
Create mock quiz data for testing UI without API calls:

```typescript
const MOCK_QUIZ: QuizGenerationResponse = {
  quiz_id: 'test-123',
  pdf_filename: 'sample.pdf',
  topic: 'Cell Biology',
  difficulty_level: 'medium',
  questions: [
    {
      question: 'What is the powerhouse of the cell?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
      correct_answer: 'Mitochondria',
      explanation: 'Mitochondria generate ATP...',
      difficulty: 'easy'
    },
    // ... more questions
  ]
};
```

### 3. Console Logging
Add debug logs to track data flow:

```typescript
console.log('📄 PDF uploaded:', file.name);
console.log('🤖 Generating quiz...');
console.log('✅ Quiz generated:', quizData);
console.log('💾 Saving to database...');
```

### 4. Chrome DevTools
- **Application tab**: Check localStorage for database
- **Network tab**: Monitor API calls
- **Console tab**: View logs and errors

---

## 🚀 Next Steps

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Complete Day 1-2 Tasks** (PDF extraction)

3. **Test with Sample PDF**

4. **Move to Day 3-5 Tasks** (LLM integration)

5. **Follow Implementation Checklist**: `/Pre_Validation/12_Implementation_Checklist.md`

---

**Questions?** Refer to documentation in `/Pre_Validation/` folder.

**Stuck?** Check "Common Issues & Solutions" section above.

**Ready to code!** 💻

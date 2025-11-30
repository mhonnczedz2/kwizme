# QuizMe - Testing Guide

## Current Status (Week 3-4 Complete)

The QuizMe MVP now has a fully functional quiz generation and taking interface!

**Recent Fix**: Replaced `pdf-parse` with `pdfjs-dist` (Mozilla PDF.js) to resolve canvas dependency issues in Next.js serverless environment.

## What's Implemented

### 1. PDF Upload & Processing
- Drag-and-drop file upload
- PDF text extraction using pdfjs-dist (Mozilla PDF.js)
- File validation (PDF only, 10MB max)
- Works in Next.js serverless environment

### 2. Quiz Generation
- Gemini Flash API integration
- Prompt engineering for different difficulty levels
- JSON parsing and validation
- 15 questions generated per PDF

### 3. Quiz Taking Interface
- Clean, interactive question display
- Multiple choice options (A, B, C, D)
- Real-time answer validation
- Hint system (click to reveal, no score penalty)
- Difficulty badges (easy/medium/hard)
- Progress bar and question counter
- Instant feedback (correct/incorrect highlighting)
- Explanations after submitting answers

### 4. Results & Scoring
- Final score breakdown
- Grade calculation (A-F)
- Percentage display
- Visual progress bar
- Stats: Correct/Incorrect/Total
- Try Again and Back to Home options

## How to Test

### Step 1: Start the Development Server

**IMPORTANT**: You need to allow network access for the Next.js dev server.

If using Claude Code's security sandbox:
1. Open monitoring dashboard: http://localhost:7505
2. Select "Tools" from sidebar
3. Click "Add Tool"
4. Enter process name: `node`
5. Select 'Permanent'
6. Click "Add Tool"

Then run:
```bash
npm run dev
```

### Step 2: Convert Sample Biology Text to PDF

You have a sample biology file: `sample-biology.txt`

**Option A: Using Google Docs (Recommended)**
1. Open Google Docs: https://docs.google.com
2. Create new document
3. Copy content from `sample-biology.txt`
4. Paste into Google Docs
5. File → Download → PDF Document (.pdf)
6. Save as `sample-biology.pdf`

**Option B: Using Online Converter**
1. Go to https://txt2pdf.com or https://www.online-convert.com/
2. Upload `sample-biology.txt`
3. Convert to PDF
4. Download the PDF

**Option C: Using Command Line (macOS)**
```bash
textutil -convert html sample-biology.txt -output sample-biology.html
wkhtmltopdf sample-biology.html sample-biology.pdf
```

### Step 3: Test the Full Flow

1. **Open the app**: http://localhost:3000

2. **Upload PDF**:
   - Drag and drop `sample-biology.pdf` onto the upload zone
   - OR click "Choose File" and select it

3. **Generate Quiz**:
   - Click "Generate Quiz" button
   - Wait 5-10 seconds for AI generation
   - Watch console logs for progress

4. **Take the Quiz**:
   - Read each question carefully
   - Click on an answer option to select it
   - Use "Show Hint" if available (no penalty)
   - Click "Submit Answer" to check correctness
   - Read the explanation
   - Click "Next Question" to continue

5. **View Results**:
   - After finishing all 15 questions
   - See your final score and grade
   - View breakdown of correct/incorrect
   - Try again or return to home

## Expected Console Output

When generating a quiz, you should see:
```
📄 Processing PDF: sample-biology.pdf
✅ Extracted text length: 5000 characters
🤖 Generating quiz with Gemini Flash...
✅ Quiz generated successfully: 15 questions
```

## Features to Test

- [ ] PDF upload (drag-drop and click)
- [ ] Quiz generation (15 questions)
- [ ] Hint system (click to reveal)
- [ ] Answer selection
- [ ] Submit answer
- [ ] Correct/incorrect highlighting
- [ ] Explanation display
- [ ] Next question navigation
- [ ] Progress bar updates
- [ ] Score tracking
- [ ] Final results page
- [ ] Try Again button
- [ ] Back to Home button

## Known Limitations

1. **No Database Persistence**: Quiz data is not saved to SQL.js database yet (Week 5-6 task)
2. **No Quiz History**: Can't view past quizzes (Week 5-6 task)
3. **No Configuration Options**: Difficulty is fixed to "medium" (Week 5-6 task)
4. **No Subdirectory Organization**: Institution/Program/Course metadata not used yet

## Next Steps (Week 5-6)

1. Save generated quizzes to SQL.js database
2. Create "Check Quizzes" page to browse saved quizzes
3. Create "Quiz History" page to view past attempts
4. Add configuration modal for difficulty selection
5. Implement organizational hierarchy filtering

## Troubleshooting

### Dev Server Won't Start
- Check if port 3000 is already in use
- Add `node` to security sandbox allowlist
- Try: `lsof -ti:3000 | xargs kill` then restart

### PDF Upload Fails
- Ensure file is a valid PDF
- Check file size is under 10MB
- Verify file extension is `.pdf`

### Quiz Generation Fails
- Check console for error messages
- Verify GEMINI_API_KEY is set in `.env.local`
- Ensure API key is valid and has quota
- Check network connection

### TypeScript Errors
- Run: `npx tsc --noEmit` to check compilation
- All types should compile without errors

## File Structure

```
/quizme
├── app/
│   ├── page.tsx              # Main app with state management
│   └── api/
│       └── generate-quiz/
│           └── route.ts      # Quiz generation endpoint
├── components/
│   ├── FileUploadZone.tsx    # Drag-drop upload
│   ├── QuizDisplay.tsx       # Quiz taking interface
│   └── QuizResults.tsx       # Results page
├── lib/
│   ├── pdf-parser.ts         # PDF text extraction
│   ├── llm-client.ts         # Gemini Flash integration
│   └── db/
│       ├── schema.ts         # Database schema
│       ├── client.ts         # SQL.js utilities
│       └── types.ts          # TypeScript interfaces
├── .env.local                # API keys (GEMINI_API_KEY)
└── sample-biology.txt        # Test content
```

## API Key Management

Your Gemini API key is stored in `.env.local`:
```
GEMINI_API_KEY=AIzaSyBuzna5D27mZcdfoj2ouEhYAXSuJEH_A28
```

**Important**:
- Never commit `.env.local` to git
- Get your own key at: https://makersuite.google.com/app/apikey
- Free tier: 15 requests per minute

## Quiz Generation Details

**Prompt Engineering**:
- Easy: Recall & comprehension (definitions, key facts)
- Medium: Application & analysis (concepts, relationships)
- Hard: Synthesis & evaluation (compare, analyze scenarios)

**JSON Format**:
```json
{
  "quiz_id": "quiz-1234567890-abc123",
  "pdf_filename": "sample-biology.pdf",
  "topic": "Generated Quiz",
  "difficulty_level": "medium",
  "questions": [
    {
      "question": "What is the main difference between prokaryotic and eukaryotic cells?",
      "options": ["Size difference", "Membrane-bound nucleus", "Cell wall", "DNA type"],
      "correct_answer": "Membrane-bound nucleus",
      "explanation": "Eukaryotic cells have a membrane-bound nucleus...",
      "hint": "Think about the nuclear envelope.",
      "difficulty": "easy"
    }
  ]
}
```

## Success Criteria

You'll know it's working when:
1. ✅ PDF uploads successfully
2. ✅ Console shows "Quiz generated successfully: 15 questions"
3. ✅ Quiz interface displays with 15 questions
4. ✅ Can select answers and submit
5. ✅ Hints work (click to reveal)
6. ✅ Correct/incorrect highlighting appears
7. ✅ Explanations display after submitting
8. ✅ Progress bar updates as you advance
9. ✅ Final results page shows score and grade
10. ✅ Can navigate back to home and upload again

## Performance Notes

- Quiz generation takes 5-10 seconds (Gemini Flash API call)
- PDF parsing is instant for files < 10MB
- Client-side database (SQL.js) loads in ~100ms
- All quiz-taking is instant (client-side only)

Enjoy testing QuizMe! 🎉

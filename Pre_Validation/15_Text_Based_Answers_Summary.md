# QuizMe: Schema Updates - Text-Based Answers & Hints

**Summary**: Updated schema from index-based to text-based correct answers, added hints and per-question difficulty.

---

## ✅ Changes Completed

### 1. Updated `questions` Table Schema

**File**: `03_Technical_Architecture.md`

```sql
CREATE TABLE questions (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id TEXT NOT NULL,
    question_text TEXT NOT NULL,

    -- NEW: Text-based answer system
    options TEXT NOT NULL,              -- JSON: ["answer1", "answerA", "1answer", "answer_A"]
    correct_answer TEXT NOT NULL,       -- "answerA" (actual answer text)
    correct_answer_index INTEGER,       -- DEPRECATED: Kept for backward compatibility

    -- NEW: Additional metadata
    explanation TEXT,                   -- Why the answer is correct
    hint TEXT,                          -- Optional hint (click to reveal)
    difficulty TEXT,                    -- "easy", "medium", "hard" per question

    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);
```

### 2. Updated API Response Schema

**File**: `03_Technical_Architecture.md`

```typescript
{
  quiz_id: string,
  pdf_filename: string,
  topic: string,
  difficulty_level: string,    // User-selected override (AI suggests average)

  questions: [
    {
      question: string,
      options: string[],         // ["answer1", "answerA", "1answer", "answer_A"]
      correct_answer: string,    // "answerA"
      explanation: string,
      hint?: string,             // Optional
      difficulty: string         // "easy" | "medium" | "hard"
    }
  ]
}
```

### 3. Updated LLM Prompt

**File**: `04_AI_Integration.md`

```python
base_prompt = """
...
Each question must have:
- 1 correct answer (provide the actual answer text)
- 3 plausible distractors
- Brief explanation
- Optional hint (helpful clue without giving away the answer)
- Difficulty rating based on cognitive complexity

Return JSON:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Answer A", "Answer B", "Answer C", "Answer D"],
      "correct_answer": "Answer B",
      "explanation": "Explanation here.",
      "hint": "Think about the relationship between X and Y.",
      "difficulty": "medium"
    }
  ]
}
"""
```

### 4. Updated Validation Logic

**File**: `04_AI_Integration.md`

```typescript
// NEW: Validate correct_answer matches one of the options
if (!q.options.includes(q.correct_answer)) {
  throw new Error(`correct_answer "${q.correct_answer}" not found in options`);
}

// NEW: Validate hint length (if provided)
if (q.hint && (q.hint.length < 10 || q.hint.length > 100)) {
  throw new Error(`Hint too short/long`);
}

// NEW: Validate difficulty
if (!["easy", "medium", "hard"].includes(q.difficulty)) {
  throw new Error(`Invalid difficulty level`);
}
```

---

## Key Design Decisions

### 1. Text-Based Correct Answer

**Why:**
- ✅ Enables future "randomize options" feature
- ✅ More intuitive for data analysis
- ✅ Simpler answer checking logic

**How it works:**
```typescript
// Old way (index-based):
options: ["A", "B", "C", "D"]
correct_answer_index: 1  // Points to "B"
// Problem: If you shuffle options, index breaks!

// New way (text-based):
options: ["answer1", "answerA", "1answer", "answer_A"]
correct_answer: "answerA"
// Solution: Shuffle options freely, match by text ✅
```

**Randomization feature (future):**
```typescript
// Load question
const question = {
    options: ["answer1", "answerA", "1answer", "answer_A"],
    correct_answer: "answerA"
};

// If "randomize options" enabled:
const shuffled = shuffle(question.options);
// ["1answer", "answer_A", "answer1", "answerA"]

// User selects "answerA"
// Check: selectedAnswer === correct_answer ✅ Simple!
```

### 2. Backward Compatibility

**Keep `correct_answer_index` for old quizzes:**
```typescript
function getCorrectAnswer(question: Question): string {
    // New quizzes: use text-based
    if (question.correct_answer) {
        return question.correct_answer;
    }

    // Old quizzes: fallback to index
    if (question.correct_answer_index !== null) {
        const options = JSON.parse(question.options);
        return options[question.correct_answer_index];
    }

    throw new Error("No correct answer found");
}
```

### 3. Hints Feature

**Behavior:**
- **Display**: Click to reveal (not shown by default)
- **Score impact**: None (hints don't affect score)
- **Optional**: LLM may or may not provide a hint

**UI Flow:**
```
Question: What is the primary function of mitochondria?

[○] Protein synthesis
[○] Energy production
[○] DNA replication
[○] Cell division

[Show Hint] (button, initially visible)

↓ (user clicks)

💡 Hint: Think about what powers cellular processes.

[Hide Hint] (button, now visible)
```

### 4. Per-Question Difficulty

**Quiz-level difficulty calculation:**
```typescript
function calculateQuizDifficulty(questions: Question[]): string {
    const difficultyScores = {
        "easy": 1,
        "medium": 2,
        "hard": 3
    };

    const total = questions.reduce((sum, q) =>
        sum + difficultyScores[q.difficulty], 0
    );

    const average = total / questions.length;

    // Convert back to difficulty level
    if (average <= 1.5) return "easy";
    if (average <= 2.5) return "medium";
    return "hard";
}
```

**User override:**
- AI suggests difficulty based on question average
- User can override when creating quiz:
  ```
  AI suggests: Medium (based on 8 medium + 2 hard questions)

  User can change to:
  [Easy ▼] [Medium ▼] [Hard ▼] <-- User selects
  ```

---

## Migration Strategy

### For New Quizzes (Going Forward)

1. LLM generates quiz with `correct_answer` (text)
2. Don't set `correct_answer_index` (leave NULL)
3. Include `hint` if LLM provides one
4. Include `difficulty` for each question

### For Old Quizzes (Backward Compatibility)

**Option 1: Read-Only (Recommended for MVP)**
- Keep old quizzes as-is
- Use fallback logic to convert index → text when loading
- Don't allow editing old quizzes

**Option 2: One-Time Migration (Phase 2)**
```sql
-- Migrate old quizzes to new format
UPDATE questions
SET correct_answer = json_extract(options, '$[' || correct_answer_index || ']')
WHERE correct_answer IS NULL AND correct_answer_index IS NOT NULL;
```

---

## Updated User Flow

### Taking a Quiz

**1. Display Question:**
```
Question 3 of 15

What is the primary function of mitochondria in eukaryotic cells?

[○] Protein synthesis
[○] Energy production (ATP)
[○] DNA replication
[○] Cell division

[Show Hint]  [Submit Answer]
```

**2. User Clicks "Show Hint":**
```
💡 Hint: Mitochondria are often called the "powerhouses" of the cell.

[Hide Hint]  [Submit Answer]
```

**3. User Selects Answer and Submits:**
```typescript
// User selected: "Energy production (ATP)"
const userAnswer = "Energy production (ATP)";

// Check answer
const isCorrect = userAnswer === question.correct_answer;
// isCorrect = true ✅

// Display feedback
if (isCorrect) {
    showFeedback("Correct!", question.explanation);
} else {
    showFeedback(`Incorrect. The correct answer is: ${question.correct_answer}`, question.explanation);
}
```

**4. Show Feedback:**
```
✓ Correct!

Mitochondria are known as the "powerhouses" of the cell
because they generate ATP through cellular respiration.

[Next Question →]
```

---

## Future Features Enabled

### 1. Randomize Options ✅
```typescript
// Shuffle options array
function randomizeOptions(question: Question) {
    return {
        ...question,
        options: shuffle(question.options)
        // correct_answer stays the same, matching still works!
    };
}
```

### 2. Randomize Questions ✅
```typescript
// Shuffle questions array
function randomizeQuestions(quiz: Quiz) {
    return {
        ...quiz,
        questions: shuffle(quiz.questions)
    };
}
```

### 3. Difficulty-Based Filtering
```sql
-- Get only hard questions
SELECT * FROM questions WHERE difficulty = 'hard';

-- Get mixed difficulty quiz (3 easy, 5 medium, 2 hard)
(SELECT * FROM questions WHERE difficulty = 'easy' LIMIT 3)
UNION
(SELECT * FROM questions WHERE difficulty = 'medium' LIMIT 5)
UNION
(SELECT * FROM questions WHERE difficulty = 'hard' LIMIT 2);
```

### 4. Hint Analytics
```sql
-- Track if user viewed hint
ALTER TABLE answer_records ADD COLUMN viewed_hint BOOLEAN DEFAULT FALSE;

-- Analyze: Do hints improve performance?
SELECT
    viewed_hint,
    AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as success_rate
FROM answer_records
GROUP BY viewed_hint;
```

---

## Implementation Checklist

### Week 3-4 (Frontend Core)

- [ ] **Update question interface TypeScript types**
  ```typescript
  interface Question {
      question_id: number;
      question_text: string;
      options: string[];
      correct_answer: string;
      correct_answer_index?: number; // Optional for old quizzes
      explanation: string;
      hint?: string;
      difficulty: "easy" | "medium" | "hard";
  }
  ```

- [ ] **Update answer checking logic**
  ```typescript
  function checkAnswer(question: Question, userAnswer: string): boolean {
      const correctAnswer = getCorrectAnswer(question);
      return userAnswer === correctAnswer;
  }
  ```

- [ ] **Build hint UI component**
  - [ ] "Show Hint" button (initially visible if hint exists)
  - [ ] "Hide Hint" button (visible after showing)
  - [ ] Hint text display (styled with 💡 icon)
  - [ ] No score impact (don't track hint usage for scoring)

- [ ] **Update quiz difficulty display**
  - [ ] Show AI-suggested difficulty
  - [ ] Allow user override (dropdown)
  - [ ] Save user selection to database

### Week 5-6 (Polish & PWA)

- [ ] **Test backward compatibility**
  - [ ] Load old quiz (with `correct_answer_index`)
  - [ ] Verify fallback logic works
  - [ ] Test answer checking with old quizzes

- [ ] **Test new features**
  - [ ] Generate new quiz with hints
  - [ ] Verify hint display/hide works
  - [ ] Test difficulty calculation
  - [ ] Verify text-based answer matching

---

## Benefits Summary

### Immediate Benefits
- ✅ More intuitive answer system (text vs index)
- ✅ Hints provide learning support
- ✅ Per-question difficulty for better quiz composition
- ✅ Backward compatible with old quizzes

### Future Benefits
- ✅ Enables randomization features (options & questions)
- ✅ Better analytics (difficulty-based performance)
- ✅ Adaptive quizzing (adjust difficulty based on performance)
- ✅ Hint effectiveness tracking

### No Breaking Changes
- ✅ Old quizzes still work (fallback logic)
- ✅ Migration can happen gradually
- ✅ Can implement in MVP timeline (no delays)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28
**Files Modified**:
- 03_Technical_Architecture.md (schema + API)
- 04_AI_Integration.md (prompt + validation)

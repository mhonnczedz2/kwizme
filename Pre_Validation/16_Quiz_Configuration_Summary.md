# QuizMe: Quiz Configuration System - Implementation Summary

**Summary**: Added session configuration modal with presets (Learn, Test, Fast Learn) and custom options for quiz-taking experience

---

## ✅ Changes Completed

### 1. Updated `review_sessions` Table Schema

**File**: `03_Technical_Architecture.md`

```sql
CREATE TABLE review_sessions (
    session_id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER,
    score_percentage REAL,
    time_spent_seconds INTEGER,

    -- NEW: Session configuration options
    quick_submit BOOLEAN DEFAULT FALSE,              -- Auto-submit on answer selection
    show_explanation BOOLEAN DEFAULT TRUE,           -- Display explanation after each answer
    time_limit_seconds INTEGER,                      -- Per-question timer (NULL = no limit)
    randomize_options BOOLEAN DEFAULT FALSE,         -- Shuffle answer choices
    randomize_questions BOOLEAN DEFAULT FALSE,       -- Shuffle question order
    num_questions_selected INTEGER NOT NULL,         -- Number of questions in this session
    preset_name TEXT,                                -- "learn", "test", "fast_learn", "custom"

    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);
```

### 2. Added Configuration Modal UI

**File**: `05_User_Flow_UX.md` → New Step 1C

**Desktop Modal**:
- Configuration modal appears before starting quiz
- Quick preset buttons: Learn, Test, Fast Learn, Custom
- 6 configuration options with toggles and dropdowns
- Visual hierarchy: Presets → Configuration → Action buttons

**Mobile Modal**:
- Scrollable modal with compact layout
- Preset buttons horizontal or dropdown (responsive)
- Native mobile toggles (iOS switch, Android toggle)
- Full-width input fields

### 3. Configuration Options

**Six configurable options:**

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| Quick Submit | Toggle | OFF | Auto-submit on answer selection |
| Show Explanation | Toggle | ON | Display explanation after each answer |
| Time Limit per Question | Dropdown | 120s | Per-question countdown timer |
| Randomize Options | Toggle | OFF | Shuffle answer choices (text-based only) |
| Randomize Questions | Toggle | OFF | Shuffle question order |
| Number of Questions | Number Input | All | Select subset of questions |

### 4. Quick Session Presets

**1. Learn (Default)**
- Quick Submit: OFF
- Show Explanation: ON
- Time Limit: 120 seconds
- Randomize Options: OFF
- Randomize Questions: OFF
- Number of Questions: All

**Use case**: Focused learning with explanations and moderate time pressure

**2. Test**
- Quick Submit: OFF
- Show Explanation: OFF
- Time Limit: 300 seconds
- Randomize Options: OFF
- Randomize Questions: OFF
- Number of Questions: All

**Use case**: Simulate exam conditions with time pressure but no hints

**3. Fast Learn**
- Quick Submit: ON
- Show Explanation: OFF
- Time Limit: 20 seconds
- Randomize Options: OFF
- Randomize Questions: OFF
- Number of Questions: All

**Use case**: Quick review/drill mode for speed and recall

**4. Custom**
- User manually configures all options
- All toggles and inputs become interactive
- Configuration saved as "last custom settings"

---

## Key Design Decisions

### 1. Presets vs Custom Configuration

**Why presets?**
- ✅ Reduces cognitive load (users don't need to understand all options)
- ✅ Provides opinionated defaults for common use cases
- ✅ Faster to start quiz (one-click preset selection)

**Why custom?**
- ✅ Power users can fine-tune experience
- ✅ Experiment with different learning strategies
- ✅ Accommodate unique study needs

### 2. Configuration Storage Strategy

**Session-level storage (database)**:
- Store configuration with each session in `review_sessions` table
- Enables analyzing which configurations lead to better scores
- Supports "Retake with same settings" feature
- Historical record of how user studied

**User preferences (localStorage)**:
- Remember last used preset
- Remember custom configuration settings
- Pre-populate modal on next quiz

**Benefits**:
- ✅ User doesn't need to reconfigure every time
- ✅ Can still experiment with different settings per session
- ✅ Data-driven insights (which preset works best?)

### 3. Randomization Compatibility

**Problem**: Old quizzes use index-based answers (`correct_answer_index`), new quizzes use text-based answers (`correct_answer`)

**Solution**:
```typescript
function canRandomizeOptions(quiz: Quiz): boolean {
    // Check if all questions have text-based answers
    return quiz.questions.every(q => q.correct_answer !== null);
}

// In configuration modal:
if (!canRandomizeOptions(currentQuiz)) {
    disableToggle("randomize_options");
    showTooltip("This quiz uses legacy format. Randomization not available.");
}
```

**Benefits**:
- ✅ Graceful degradation for old quizzes
- ✅ Clear user communication (tooltip explains why disabled)
- ✅ Encourages migration to new format

### 4. Time Limit Behavior

**Design choices**:
- Timer displayed above question (always visible)
- Visual warning at 10 seconds (timer turns red)
- Auto-submit when time expires (counts as incorrect)
- Timer resets for each question (not cumulative)

**Why not cumulative time?**
- Individual timers reduce pressure per question
- Easier to calibrate (2 minutes per question = 30 minutes for 15 questions)
- User can pace themselves better

**Why count as incorrect?**
- Penalty for running out of time (simulates real exam)
- Alternative considered: Skip question (rejected: too lenient)

### 5. Question Selection Algorithm

**When `num_questions_selected < total_questions`:**

```typescript
function selectQuestions(
    allQuestions: Question[],
    numToSelect: number,
    sessionSeed: number
): Question[] {
    // Group by difficulty
    const easy = allQuestions.filter(q => q.difficulty === "easy");
    const medium = allQuestions.filter(q => q.difficulty === "medium");
    const hard = allQuestions.filter(q => q.difficulty === "hard");

    // Calculate target distribution (maintain quiz balance)
    const easyRatio = easy.length / allQuestions.length;
    const mediumRatio = medium.length / allQuestions.length;
    const hardRatio = hard.length / allQuestions.length;

    const targetEasy = Math.round(numToSelect * easyRatio);
    const targetMedium = Math.round(numToSelect * mediumRatio);
    const targetHard = numToSelect - targetEasy - targetMedium;

    // Randomly select from each difficulty tier
    const selected = [
        ...randomSample(easy, targetEasy, sessionSeed),
        ...randomSample(medium, targetMedium, sessionSeed + 1),
        ...randomSample(hard, targetHard, sessionSeed + 2)
    ];

    return shuffle(selected, sessionSeed + 3);
}
```

**Benefits**:
- ✅ Maintains difficulty distribution (10/15 questions = same ratio of easy/medium/hard)
- ✅ Selection changes each session (different seed)
- ✅ Fair representation of quiz content

---

## User Interaction Flows

### Flow 1: First-Time User (Defaults to "Learn" Preset)

```
1. User uploads PDF → Quiz generated
2. User clicks [Take Quiz] from quiz card
3. Configuration modal opens
   - "Learn" preset selected by default
   - Configuration shows preset values
4. User clicks [Start Quiz →] (accepts default)
5. Session created with Learn configuration
6. Quiz interface loads:
   - Submit button visible (Quick Submit OFF)
   - 2-minute countdown timer visible
   - Explanation screen will appear after each answer
```

### Flow 2: User Experiments with Presets

```
1. User clicks [Take Quiz]
2. Configuration modal opens (defaults to last used preset)
3. User clicks [Test] preset
   - Configuration updates to Test values
   - User sees: Show Explanation OFF, Time Limit 300s
4. User clicks [Start Quiz →]
5. Quiz runs in test mode:
   - No explanations after answers
   - 5-minute timer per question
   - Only shows correct/incorrect at end
```

### Flow 3: Advanced User (Custom Configuration)

```
1. User clicks [Take Quiz]
2. Configuration modal opens
3. User clicks [Custom]
   - All toggles/inputs become interactive
4. User customizes:
   - Show Explanation: OFF (no explanations)
   - Randomize Options: ON (shuffle choices)
   - Number of Questions: 10 (quick review)
5. User clicks [Start Quiz →]
6. Quiz runs with custom config:
   - 10 randomly selected questions
   - Options shuffled for each question
   - No explanation screen after answers
7. Next time user clicks [Take Quiz]:
   - Modal remembers custom configuration
   - User can tweak or use as-is
```

### Flow 4: Retake with Same Settings

```
1. User goes to Quiz History
2. User sees previous session: "87% (13/15), Learn preset"
3. User clicks [Retake]
4. Configuration modal opens
   - Pre-filled with previous session's configuration
   - Preset: Learn
   - All settings match previous session
5. User can:
   A. Click [Start Quiz →] to use same config
   B. Switch preset or modify settings
6. New session created with selected configuration
```

---

## Implementation Checklist

### Week 3-4 (Frontend Core)

- [ ] **Update database schema**
  - [ ] Add configuration columns to `review_sessions` table
  - [ ] Create migration for existing sessions (set defaults)
  - [ ] Test backward compatibility

- [ ] **Build configuration modal component**
  - [ ] Create modal shell (desktop + mobile responsive)
  - [ ] Build preset button group
  - [ ] Build configuration option toggles/inputs
  - [ ] Add preset → configuration logic
  - [ ] Add custom preset editing mode

- [ ] **Implement configuration options**
  ```typescript
  interface SessionConfig {
      quick_submit: boolean;
      show_explanation: boolean;
      time_limit_seconds: number | null;
      randomize_options: boolean;
      randomize_questions: boolean;
      num_questions_selected: number;
      preset_name: "learn" | "test" | "fast_learn" | "custom";
  }
  ```

- [ ] **Build preset logic**
  ```typescript
  const PRESETS: Record<string, SessionConfig> = {
      learn: { quick_submit: false, show_explanation: true, time_limit_seconds: 120, ... },
      test: { quick_submit: false, show_explanation: false, time_limit_seconds: 300, ... },
      fast_learn: { quick_submit: true, show_explanation: false, time_limit_seconds: 20, ... }
  };
  ```

- [ ] **Implement localStorage preferences**
  - [ ] Save last used preset
  - [ ] Save custom configuration
  - [ ] Load preferences on modal open

### Week 5-6 (Quiz Logic Updates)

- [ ] **Update quiz-taking logic**
  - [ ] Implement quick submit behavior
  - [ ] Implement explanation screen toggle
  - [ ] Implement per-question timer with countdown
  - [ ] Implement option randomization (text-based only)
  - [ ] Implement question randomization
  - [ ] Implement question subset selection

- [ ] **Build timer component**
  ```typescript
  interface TimerProps {
      timeLimit: number;           // seconds
      onExpire: () => void;        // auto-submit callback
      warningThreshold: number;    // seconds (e.g., 10)
  }
  ```

- [ ] **Build randomization logic**
  ```typescript
  function randomizeOptions(question: Question, seed: number): Question {
      if (!question.correct_answer) {
          console.warn("Cannot randomize legacy quiz");
          return question;
      }
      return {
          ...question,
          options: shuffle(question.options, seed)
          // correct_answer stays the same, matching still works!
      };
  }

  function randomizeQuestions(questions: Question[], seed: number): Question[] {
      return shuffle(questions, seed);
  }
  ```

- [ ] **Implement question selection**
  ```typescript
  function selectQuestions(
      allQuestions: Question[],
      numToSelect: number,
      sessionId: string
  ): Question[] {
      const seed = hashString(sessionId);
      // Maintain difficulty distribution
      return selectWithDistribution(allQuestions, numToSelect, seed);
  }
  ```

### Week 7-8 (Polish & Testing)

- [ ] **Test all preset configurations**
  - [ ] Learn preset: Verify explanations, 2-min timer, submit button
  - [ ] Test preset: Verify no explanations, 5-min timer, test mode
  - [ ] Fast Learn preset: Verify auto-submit, 20-sec timer, no explanations

- [ ] **Test custom configurations**
  - [ ] All combinations of toggles work correctly
  - [ ] Custom config persists across sessions
  - [ ] Retake with same settings works

- [ ] **Test edge cases**
  - [ ] Legacy quiz: Randomize Options disabled + tooltip
  - [ ] Timer expiration: Auto-submit works, counts as incorrect
  - [ ] Question subset: Selection changes each session
  - [ ] Randomization: Different order each session

- [ ] **Mobile optimization**
  - [ ] Modal scrollable on small screens
  - [ ] Preset buttons responsive (collapse to dropdown if needed)
  - [ ] Native mobile toggles (iOS/Android)
  - [ ] Touch-friendly input sizes

- [ ] **Accessibility**
  - [ ] Keyboard navigation through modal
  - [ ] Screen reader announcements for timer warnings
  - [ ] Focus management (modal open/close)
  - [ ] ARIA labels for all toggles

---

## Benefits Summary

### Immediate Benefits
- ✅ Three opinionated presets for common study modes
- ✅ Custom configuration for power users
- ✅ Configuration persists across sessions (localStorage)
- ✅ Session-level tracking enables future analytics

### Enhanced Learning Experience
- ✅ **Learn mode**: Explanations + moderate time pressure = deep learning
- ✅ **Test mode**: No explanations + time pressure = exam simulation
- ✅ **Fast Learn mode**: Auto-submit + short timer = spaced repetition drill

### Future Benefits
- ✅ Analytics: Which configuration leads to better scores?
- ✅ Adaptive learning: Recommend preset based on past performance
- ✅ Social features: Share quiz with recommended configuration
- ✅ Progress tracking: Track improvement across different modes

### No Breaking Changes
- ✅ Defaults to "Learn" preset (explanations ON, like original behavior)
- ✅ Legacy quizzes still work (randomization gracefully disabled)
- ✅ Existing sessions unaffected (new columns have defaults)

---

## Future Enhancements (Post-MVP)

### 1. Adaptive Difficulty
- Track user performance per configuration
- Recommend preset based on past scores
- Example: "You scored 95% in Learn mode. Try Test mode for a challenge!"

### 2. Spaced Repetition Integration
- Fast Learn preset + algorithm = optimal review schedule
- Auto-select questions based on performance history
- "Review 5 questions you got wrong last time"

### 3. Configuration Templates
- Save multiple custom configurations
- Name templates: "Quick Review", "Deep Study", "Exam Prep"
- Share templates with other users

### 4. Analytics Dashboard
- Compare performance across presets
- Visualize: Learn mode avg 78%, Test mode avg 65%
- Insights: "You perform 13% better with explanations enabled"

### 5. Timer Variations
- Adaptive timer: Starts at 120s, reduces to 60s as user improves
- Cumulative timer: Total time budget for entire quiz
- Bonus time: Earn extra seconds for correct answers

---

## Technical Implementation Notes

### 1. Randomization Seed Strategy

**Why use session ID as seed?**
- Deterministic: Same session = same question order (for consistency)
- Unique: Different sessions = different order (prevents memorization)
- Reproducible: Can recreate exact session for review

```typescript
function generateSeed(sessionId: string): number {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
        hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
        hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}
```

### 2. Timer Pause/Resume Logic

**Should timer pause when tab is hidden?**

**Option A: Pause timer (recommended for MVP)**
- User-friendly: Accommodates interruptions
- Trust-based: Assumes honest usage
- Implementation: Use `document.visibilityState`

**Option B: Continue timer (for strict mode)**
- Exam-accurate: Real tests don't pause
- Anti-cheating: Prevents tab-switching to look up answers
- Implementation: Use server timestamp comparison

**MVP Decision**: Pause timer, add strict mode in Phase 2

```typescript
useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.hidden) {
            pauseTimer();
        } else {
            resumeTimer();
        }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
}, []);
```

### 3. Question Subset Selection Performance

**Challenge**: Selecting 10/1000 questions while maintaining distribution

**Naive approach** (slow for large quizzes):
```typescript
// O(n log n) - sorts entire array
const shuffled = shuffle(allQuestions);
return shuffled.slice(0, numToSelect);
```

**Optimized approach** (fast for large quizzes):
```typescript
// O(k) where k = numToSelect
function reservoirSample(questions: Question[], k: number, seed: number): Question[] {
    const rng = seededRandom(seed);
    const reservoir = questions.slice(0, k);

    for (let i = k; i < questions.length; i++) {
        const j = Math.floor(rng() * (i + 1));
        if (j < k) {
            reservoir[j] = questions[i];
        }
    }

    return reservoir;
}
```

**MVP Decision**: Use naive approach (quizzes rarely exceed 50 questions), optimize in Phase 2 if needed

---

## Migration Guide

### For Existing Quizzes

**No migration needed!**
- New columns have default values
- Existing sessions show as "Learn" preset (defaults match original behavior)
- Users can retake old quizzes with new configurations

### For Existing Code

**Update quiz start logic**:
```typescript
// OLD: Direct start
function startQuiz(quizId: string) {
    const session = createSession(quizId);
    navigateToQuiz(session.session_id);
}

// NEW: Show configuration modal first
function startQuiz(quizId: string) {
    showConfigurationModal(quizId, (config: SessionConfig) => {
        const session = createSession(quizId, config);
        navigateToQuiz(session.session_id);
    });
}
```

**Update session creation**:
```typescript
// OLD: Simple session
function createSession(quizId: string): Session {
    return {
        session_id: generateUUID(),
        quiz_id: quizId,
        started_at: new Date(),
        total_questions: getQuiz(quizId).questions.length
    };
}

// NEW: Include configuration
function createSession(quizId: string, config: SessionConfig): Session {
    return {
        session_id: generateUUID(),
        quiz_id: quizId,
        started_at: new Date(),
        total_questions: config.num_questions_selected,
        ...config  // Spread configuration fields
    };
}
```

---

## Testing Scenarios

### 1. Preset Functionality
- [ ] Click "Learn" → Verify config shows Learn values
- [ ] Click "Test" → Verify config shows Test values
- [ ] Click "Fast Learn" → Verify config shows Fast Learn values
- [ ] Click "Custom" → Verify all inputs become editable

### 2. Configuration Persistence
- [ ] Set custom config → Start quiz → Close app → Reopen → Config remembered
- [ ] Use Learn preset → Start quiz → Next quiz → Learn preset still selected
- [ ] Switch between presets → Last selected preset remembered

### 3. Quiz Behavior
- [ ] Quick Submit ON → Select answer → Immediately see result (no submit button)
- [ ] Quick Submit OFF → Select answer → Submit button appears → Click submit → See result
- [ ] Show Explanation ON → After answer → See explanation screen
- [ ] Show Explanation OFF → After answer → No explanation, go to next question
- [ ] Time Limit 120s → Timer counts down from 2:00 → Warning at 0:10 → Auto-submit at 0:00

### 4. Randomization
- [ ] Randomize Options ON (new quiz) → Options shuffled
- [ ] Randomize Options ON (legacy quiz) → Toggle disabled + tooltip
- [ ] Randomize Questions ON → Questions appear in different order each session
- [ ] Take quiz twice → Randomization produces different orders

### 5. Question Selection
- [ ] Select 10/15 questions → Only 10 questions shown
- [ ] Retake with 10 questions → Different 10 questions selected
- [ ] Difficulty distribution maintained (e.g., 2 easy, 6 medium, 2 hard)

### 6. Edge Cases
- [ ] Timer expires → Question auto-submitted as incorrect
- [ ] Select 1 question → Quiz completes after 1 question
- [ ] Select 15/15 questions → All questions shown (no random selection)
- [ ] Close modal without starting → No session created

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28
**Files Modified**:
- `03_Technical_Architecture.md` (added session config columns)
- `05_User_Flow_UX.md` (added Step 1C: Quiz Configuration)

**Related Documents**:
- `15_Text_Based_Answers_Summary.md` (text-based answers enable randomization)
- `14_Simple_Organization_Summary.md` (organizational metadata in quiz cards)
- `02_Product_Definition.md` (core features vs enhancements)

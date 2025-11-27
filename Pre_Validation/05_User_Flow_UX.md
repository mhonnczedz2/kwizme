# QuizMe: User Flow & UX

---

## Complete User Journey

```
[Discovery] → [Upload] → [Processing] → [Quiz] → [Results] → [Retention]
```

---

## Step 1: Upload (< 30 seconds)

### Entry Points

**First Visit**:
1. User lands on homepage (quizme.vercel.app)
2. Sees hero section: "Upload your PDF, get a quiz in 60 seconds"
3. Sees large upload area: "Drop PDF here or click to browse"
4. Sees navigation buttons: "Check Quizzes" and "Quiz History"

**Return Visit**:
1. User sees homepage with three main options:
   - Upload new PDF
   - **Check Quizzes** (browse organized quiz collection)
   - **Quiz History** (view past quiz attempts)

### Upload Interface

**Desktop**:
```
┌──────────────────────────────────────────────────────────┐
│  QuizMe                    [Check Quizzes] [Quiz History]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  Drop your PDF here or click to browse     │         │
│  │                                             │         │
│  │              📄                             │         │
│  │                                             │         │
│  │  Max 10MB, .pdf only                       │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  Organization (optional):                               │
│  ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ Institution ▼   │ │ Program ▼   │ │ Course ▼     │  │
│  └─────────────────┘ └─────────────┘ └──────────────┘  │
│  ┌────────────────────────────────────────────┐         │
│  │ Topic: "Chapter 5 - Cell Biology"         │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  [Generate Quiz] (disabled until file selected)         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Mobile**:
```
┌────────────────────────┐
│ QuizMe                 │
│ [≡] Menu               │
├────────────────────────┤
│ [Check Quizzes]        │
│ [Quiz History]         │
├────────────────────────┤
│  Tap to upload PDF     │
│        📄              │
│  Max 10MB              │
│                        │
│ Organization:          │
│ [Institution ▼]        │
│ [Program ▼]            │
│ [Course ▼]             │
│ [Topic input]          │
│                        │
│ [Generate Quiz]        │
└────────────────────────┘
```

### Validation & Feedback

**Client-Side Validation**:
1. **File size**: Max 10MB
   - Error: "File too large. Please upload a PDF under 10MB."
2. **File type**: .pdf extension only
   - Error: "Please upload a PDF file."
3. **File readability**: Can be opened by PDF parser
   - Error: "This PDF is corrupted or password-protected."

**Success State**:
- File name displayed: "lecture_05.pdf (2.3 MB)"
- "Generate Quiz" button enabled (blue, prominent)
- Estimated time: "Should take ~60 seconds"

### User Actions

1. **Drop file** into upload area
   - Visual feedback: Drop zone highlights blue
2. **Click to browse** and select file
   - OS file picker opens
3. **Select organization hierarchy** (optional)
   - Choose Institution (e.g., "UC Berkeley")
   - Choose Program (e.g., "Biology Major")
   - Choose Course (e.g., "BIO 101")
   - Enter Topic (e.g., "Cell Biology - Chapter 5")
4. **Click "Generate Quiz"**
   - Button shows loading state
   - Quiz is saved with organization metadata
   - Navigates to processing screen

---

## Step 1A: Check Quizzes (Browse Collection)

### Purpose
Allow users to browse and organize their quiz collection by institutional hierarchy

### Interface Design

**Desktop - Collection View**:
```
┌──────────────────────────────────────────────────────────┐
│  QuizMe > Check Quizzes            [Upload PDF] [History]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌───────────────────────────────────┐│
│  │ Recent (23)  │  │                                    ││
│  │ Collection   │  │  Recent Quizzes                    ││
│  └──────────────┘  │  ┌──────────────────────────────┐ ││
│                    │  │ 📄 Cell Biology Quiz          │ ││
│  Search:           │  │    BIO 101 • 15 questions     │ ││
│  [________🔍]      │  │    Created: 2 hours ago       │ ││
│                    │  │    [Take Quiz] [View Details] │ ││
│  Filter by:        │  └──────────────────────────────┘ ││
│  [Institution ▼]   │  ┌──────────────────────────────┐ ││
│  [Program ▼]       │  │ 📄 Genetics Quiz              │ ││
│  [Course ▼]        │  │    BIO 202 • 12 questions     │ ││
│                    │  │    Created: 1 day ago         │ ││
│                    │  │    [Take Quiz] [View Details] │ ││
│                    │  └──────────────────────────────┘ ││
│                    └───────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

**Desktop - Collection Tab (Hierarchy View)**:
```
┌──────────────────────────────────────────────────────────┐
│  QuizMe > Check Quizzes > Collection                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📚 UC Berkeley (45 quizzes)                             │
│    └─ 🎓 Biology Major (23 quizzes)                      │
│        ├─ 📖 BIO 101 - Intro to Biology (8 quizzes)      │
│        │   ├─ 📝 Cell Structure (3 quizzes)              │
│        │   ├─ 📝 Genetics Basics (2 quizzes)             │
│        │   └─ 📝 Evolution (3 quizzes)                   │
│        │                                                  │
│        └─ 📖 BIO 202 - Genetics (15 quizzes)             │
│            ├─ 📝 DNA Structure (5 quizzes)               │
│            └─ 📝 Gene Expression (10 quizzes)            │
│                                                          │
│  📚 MIT (12 quizzes)                                     │
│    └─ 🎓 Computer Science (12 quizzes)                   │
│        └─ 📖 CS 101 (12 quizzes)                         │
│            └─ 📝 Data Structures (12 quizzes)            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Mobile - Collection View**:
```
┌────────────────────────┐
│ ← Quizzes              │
│                        │
│ [Recent] [Collection]  │
├────────────────────────┤
│                        │
│ 📄 Cell Biology        │
│ BIO 101 • 15 Q         │
│ 2 hours ago            │
│ [Take]                 │
├────────────────────────┤
│ 📄 Genetics            │
│ BIO 202 • 12 Q         │
│ 1 day ago              │
│ [Take]                 │
├────────────────────────┤
│ 📄 Data Structures     │
│ CS 101 • 10 Q          │
│ 3 days ago             │
│ [Take]                 │
└────────────────────────┘
```

### Collection Hierarchy Behavior

**Drill-Down Navigation**:
1. Click **Institution** (e.g., "UC Berkeley")
   - Shows all Programs under that institution
2. Click **Program** (e.g., "Biology Major")
   - Shows all Courses in that program
3. Click **Course** (e.g., "BIO 101")
   - Shows all Topics in that course
4. Click **Topic** (e.g., "Cell Structure")
   - Shows all quizzes under that topic
   - Each quiz card shows:
     - PDF filename
     - Number of questions
     - Creation date
     - Best score (if taken)
     - Actions: [Take Quiz] [View Details] [Delete]

**Breadcrumb Navigation**:
```
QuizMe > Collection > UC Berkeley > Biology Major > BIO 101 > Cell Structure
```

### User Actions

1. **Switch between tabs**:
   - Recent: Shows all quizzes sorted by creation date
   - Collection: Shows hierarchical organization

2. **Search quizzes**:
   - Search by quiz name, topic, or course
   - Real-time filtering as user types

3. **Filter by hierarchy**:
   - Select Institution → filters Programs
   - Select Program → filters Courses
   - Select Course → shows Topics

4. **Take quiz**:
   - Click [Take Quiz] button
   - Opens quiz configuration modal (see Step 1C below)
   - After configuration, creates new session
   - Navigates to quiz interface

5. **View details**:
   - Shows quiz metadata
   - Shows past session history for this quiz
   - Option to edit organization (move to different course/topic)

---

## Step 1C: Quiz Configuration (Session Setup)

### Purpose
Allow users to customize quiz session before starting (quick submit, explanations, time limits, randomization, question selection)

### Interface Design

**Desktop - Configuration Modal**:
```
┌────────────────────────────────────────────────────────────┐
│  Configure Quiz Session                              ✕    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Cell Biology Quiz (15 questions)                         │
│  BIO 101 • UC Berkeley                                    │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Quick Session Configuration                          │ │
│  │                                                      │ │
│  │  [Learn]  [Test]  [Fast Learn]  [Custom]           │ │
│  │   ^selected                                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Configuration Options                                │ │
│  │                                                      │ │
│  │  Quick Submit              [○ OFF]                  │ │
│  │  Auto-submit upon selection                         │ │
│  │                                                      │ │
│  │  Show Explanation          [● ON ]                  │ │
│  │  Display explanation after each answer              │ │
│  │                                                      │ │
│  │  Time Limit per Question   [120 seconds ▼]         │ │
│  │  Set countdown timer (1-300s, or "None")           │ │
│  │                                                      │ │
│  │  Randomize Options         [○ OFF]                  │ │
│  │  Shuffle answer choices each session                │ │
│  │                                                      │ │
│  │  Randomize Questions       [○ OFF]                  │ │
│  │  Shuffle question order each session                │ │
│  │                                                      │ │
│  │  Number of Questions       [15 / 15      ]         │ │
│  │  Select subset (1-15)                               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│                      [Cancel]  [Start Quiz →]             │
└────────────────────────────────────────────────────────────┘
```

**Mobile - Configuration Modal**:
```
┌────────────────────────────┐
│  Configure Session    ✕   │
├────────────────────────────┤
│                            │
│  Cell Biology Quiz         │
│  15 questions              │
│                            │
│  Quick Presets:            │
│  [Learn] [Test] [Custom]  │
│                            │
│  ── Configuration ──       │
│                            │
│  Quick Submit   [○ OFF]   │
│                            │
│  Show Explanation [● ON]  │
│                            │
│  Time Limit               │
│  [120 seconds    ▼]       │
│                            │
│  Randomize Options        │
│  [○ OFF]                  │
│                            │
│  Randomize Questions      │
│  [○ OFF]                  │
│                            │
│  # of Questions           │
│  [15    ] / 15            │
│                            │
│  [Start Quiz →]           │
└────────────────────────────┘
```

### Quick Session Presets

**1. Learn (Default)**:
- Quick Submit: OFF (user must click submit)
- Show Explanation: ON (see explanation after each answer)
- Time Limit: 120 seconds per question
- Randomize Options: OFF
- Randomize Questions: OFF
- Number of Questions: All questions

**Purpose**: Focused learning with explanations and moderate time pressure

**2. Test**:
- Quick Submit: OFF (user must click submit)
- Show Explanation: OFF (no explanations, test mode)
- Time Limit: 300 seconds per question (5 minutes)
- Randomize Options: OFF
- Randomize Questions: OFF
- Number of Questions: All questions

**Purpose**: Simulate exam conditions with time pressure but no hints

**3. Fast Learn**:
- Quick Submit: ON (auto-submit on selection)
- Show Explanation: OFF (rapid-fire mode)
- Time Limit: 20 seconds per question
- Randomize Options: OFF
- Randomize Questions: OFF
- Number of Questions: All questions

**Purpose**: Quick review/drill mode for speed and recall

**4. Custom**:
- User manually configures all options
- All toggles and inputs become interactive
- Configuration saved as "last custom settings" for next session

### Configuration Option Details

**1. Quick Submit (Toggle)**
- **OFF**: User selects answer → clicks [Submit] button → sees result
- **ON**: User selects answer → immediately sees result (no submit button)
- **Use case**: Fast review mode vs deliberate answering mode

**2. Show Explanation (Toggle)**
- **OFF**: After answering, only shows ✓/✗ and correct answer
- **ON**: After answering, shows ✓/✗, correct answer, and full explanation
- **Use case**: Test mode vs learning mode

**3. Time Limit per Question (Dropdown)**
- **Options**: None, 10s, 20s, 30s, 60s, 90s, 120s, 180s, 300s
- **Default**: 120 seconds (2 minutes)
- **Behavior**:
  - Countdown timer displayed above question
  - Visual warning at 10 seconds remaining (timer turns red)
  - Auto-submit when time expires (counts as incorrect)
- **Use case**: Time pressure simulation for exams

**4. Randomize Options (Toggle)**
- **OFF**: Options appear in original order (A, B, C, D)
- **ON**: Options shuffled each session (uses text-based answer matching)
- **Use case**: Prevent answer pattern memorization
- **Note**: Only available for quizzes with text-based answers (`correct_answer` field)

**5. Randomize Questions (Toggle)**
- **OFF**: Questions appear in original order (1-15)
- **ON**: Questions shuffled each session
- **Use case**: Prevent question order memorization

**6. Number of Questions (Number Input)**
- **Range**: 1 to total questions in quiz
- **Default**: All questions (15 in example)
- **Behavior**:
  - If less than total, randomly selects N questions from quiz
  - Selection changes each session (different subset)
- **Use case**: Quick review with subset of questions

### User Interaction Flow

**Scenario 1: User selects "Learn" preset**
```
1. User clicks [Take Quiz] from quiz card
2. Configuration modal opens
3. "Learn" preset is selected by default
4. User sees preset configuration:
   - Quick Submit: OFF
   - Show Explanation: ON
   - Time Limit: 120s
   - (Other options OFF/default)
5. User clicks [Start Quiz →]
6. Session created with "Learn" configuration
7. Quiz interface loads with:
   - Submit button visible (Quick Submit OFF)
   - Explanation screen enabled
   - 2-minute countdown timer per question
```

**Scenario 2: User customizes settings**
```
1. User clicks [Take Quiz] from quiz card
2. Configuration modal opens (defaults to last used preset)
3. User clicks [Custom]
4. All toggles/inputs become interactive
5. User changes:
   - Show Explanation: OFF
   - Randomize Options: ON
   - Number of Questions: 10
6. User clicks [Start Quiz →]
7. Session created with custom configuration
8. Quiz loads with:
   - 10 randomly selected questions
   - Options shuffled for each question
   - No explanation screen after answers
```

**Scenario 3: User clicks "Retake" from Quiz History**
```
1. User clicks [Retake] from previous session
2. Configuration modal opens
3. Modal pre-fills with previous session's configuration
4. User can modify or click [Start Quiz →] to use same config
5. New session created
```

### Data Storage

**Session Configuration Fields** (added to `review_sessions` table):
```sql
ALTER TABLE review_sessions ADD COLUMN quick_submit BOOLEAN DEFAULT FALSE;
ALTER TABLE review_sessions ADD COLUMN show_explanation BOOLEAN DEFAULT TRUE;
ALTER TABLE review_sessions ADD COLUMN time_limit_seconds INTEGER; -- NULL = no limit
ALTER TABLE review_sessions ADD COLUMN randomize_options BOOLEAN DEFAULT FALSE;
ALTER TABLE review_sessions ADD COLUMN randomize_questions BOOLEAN DEFAULT FALSE;
ALTER TABLE review_sessions ADD COLUMN num_questions_selected INTEGER NOT NULL;
ALTER TABLE review_sessions ADD COLUMN preset_name TEXT; -- "learn", "test", "fast_learn", "custom"
```

**User Preferences** (stored in localStorage):
```typescript
interface QuizPreferences {
  last_preset: "learn" | "test" | "fast_learn" | "custom";
  custom_config?: {
    quick_submit: boolean;
    show_explanation: boolean;
    time_limit_seconds: number | null;
    randomize_options: boolean;
    randomize_questions: boolean;
    num_questions: number;
  };
}
```

### Implementation Notes

**1. Randomize Options Compatibility**
- Only enabled for quizzes with `correct_answer` field (text-based)
- Disabled and grayed out for old quizzes using `correct_answer_index`
- Tooltip: "This quiz uses legacy format. Randomization not available."

**2. Time Limit Behavior**
- Timer pauses if user switches tabs/minimizes app (anti-cheating measure can be added later)
- Timer resets for each question
- Expired time counts as incorrect answer (no penalty beyond that)

**3. Question Selection Algorithm**
- If `num_questions_selected < total_questions`:
  - Randomly select N questions from quiz
  - Ensure selection changes each session (use session timestamp as seed)
  - Maintain difficulty distribution if possible (e.g., if selecting 10/15, keep ratio of easy/medium/hard)

**4. Mobile Optimization**
- Modal scrollable on small screens
- Preset buttons collapse to dropdown on very small screens
- Configuration options use native mobile toggles (iOS switch, Android toggle)

---

## Step 1B: Quiz History (Past Attempts)

### Purpose
Show chronological history of all quiz attempts with scores and timestamps

### Interface Design

**Desktop - Quiz History**:
```
┌──────────────────────────────────────────────────────────┐
│  QuizMe > Quiz History            [Upload PDF] [Quizzes] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Filter: [All Time ▼] [All Courses ▼] [All Scores ▼]   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📊 Cell Biology Quiz                               │ │
│  │    BIO 101 • UC Berkeley                           │ │
│  │    Score: 13/15 (87%) ⭐                            │ │
│  │    Time: 8m 32s                                    │ │
│  │    Completed: Today at 2:34 PM                     │ │
│  │    [Review] [Retake]                               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📊 Cell Biology Quiz                               │ │
│  │    BIO 101 • UC Berkeley                           │ │
│  │    Score: 11/15 (73%)                              │ │
│  │    Time: 12m 15s                                   │ │
│  │    Completed: Yesterday at 9:15 AM                 │ │
│  │    [Review] [Retake]                               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📊 Genetics Quiz                                   │ │
│  │    BIO 202 • UC Berkeley                           │ │
│  │    Score: 10/12 (83%)                              │ │
│  │    Time: 6m 45s                                    │ │
│  │    Completed: 3 days ago                           │ │
│  │    [Review] [Retake]                               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Mobile - Quiz History**:
```
┌────────────────────────┐
│ ← Quiz History         │
│                        │
│ [Filter ▼]            │
├────────────────────────┤
│ 📊 Cell Biology        │
│ BIO 101                │
│ 87% (13/15) • 8m 32s   │
│ Today 2:34 PM          │
│ [Review] [Retake]      │
├────────────────────────┤
│ 📊 Cell Biology        │
│ BIO 101                │
│ 73% (11/15) • 12m 15s  │
│ Yesterday 9:15 AM      │
│ [Review] [Retake]      │
├────────────────────────┤
│ 📊 Genetics            │
│ BIO 202                │
│ 83% (10/12) • 6m 45s   │
│ 3 days ago             │
│ [Review] [Retake]      │
└────────────────────────┘
```

### History Statistics (Header Section)

```
┌──────────────────────────────────────────────────────────┐
│  Your Stats                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ 45          │ │ 82%         │ │ 15          │        │
│  │ Total Takes │ │ Avg Score   │ │ This Week   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### Filter Options

1. **Time Period**:
   - Today
   - This Week
   - This Month
   - All Time

2. **Course**:
   - All Courses
   - BIO 101
   - BIO 202
   - CS 101
   - (dynamically populated)

3. **Score Range**:
   - All Scores
   - 90-100% (Excellent)
   - 70-89% (Good)
   - 50-69% (Fair)
   - <50% (Needs Review)

### User Actions

1. **Review attempt**:
   - Click [Review] button
   - Shows detailed breakdown
   - Highlights incorrect answers
   - Shows explanations

2. **Retake quiz**:
   - Click [Retake] button
   - Creates new session for same quiz
   - Navigates to quiz interface

3. **Filter history**:
   - Select filters to narrow down attempts
   - View specific time periods or courses

4. **Compare attempts**:
   - See all attempts for same quiz
   - Track improvement over time
   - Identify weak areas

---

## Step 2: Processing (30-60 seconds)

### Loading Screen

**Purpose**: Set expectations, reduce perceived wait time

**Design**:
```
        Generating your quiz...

           ⏳ [Progress Bar]

    ✓ Reading PDF... (complete)
    🤖 Creating questions... (in progress)
    ⏱️ Ready! (pending)

    This usually takes 30-60 seconds.
    Stay on this page!
```

**Progress Stages**:
1. **Reading PDF** (5-10 seconds)
   - Extract text from PDF
   - Show spinner + checkmark when complete
2. **Creating questions** (20-50 seconds)
   - LLM API call in progress
   - Animated dots: "Creating questions..."
3. **Ready!** (instant)
   - Success animation
   - Auto-navigate to quiz page

### Error States

**PDF Parse Error**:
```
   ❌ Couldn't read this PDF

   This PDF format isn't supported. Try
   exporting it from Google Docs or Word.

   [Try Another PDF]  [Contact Support]
```

**LLM API Error**:
```
   ❌ Generation failed

   Our AI service is temporarily unavailable.
   Please try again in a minute.

   [Retry]  [Go Back]
```

**Timeout Error**:
```
   ⏱️ Generation took too long

   This PDF might be too complex. Try
   uploading 5-10 pages instead.

   [Try Shorter PDF]  [Go Back]
```

---

## Step 3: Taking Quiz (5-10 minutes)

### Quiz Interface

**Layout** (one question per screen):
```
┌──────────────────────────────────────┐
│ Question 3 of 15         [87% ●●●○]  │
├──────────────────────────────────────┤
│                                      │
│ What is the primary function of      │
│ mitochondria in eukaryotic cells?    │
│                                      │
│ ○ A. Protein synthesis               │
│ ○ B. Energy production (ATP)         │
│ ○ C. DNA replication                 │
│ ○ D. Cell division                   │
│                                      │
│ [Submit Answer]                      │
│                                      │
└──────────────────────────────────────┘

[Exit Quiz]
```

### Interaction Flow

**Before Answer Selected**:
- All options shown as radio buttons
- Submit button disabled (grayed out)
- User can select one option
- Submit button enables when option selected

**After Answer Selected (Correct)**:
```
✓ Correct!

Mitochondria are known as the "powerhouses"
of the cell because they generate ATP through
cellular respiration.

[Next Question →]
```
- Background: Light green (#d1fae5)
- Selected option: Dark green border
- Explanation: Below options
- Next button: Prominent, blue

**After Answer Selected (Incorrect)**:
```
✗ Incorrect. The correct answer is B.

Mitochondria are known as the "powerhouses"
of the cell because they generate ATP through
cellular respiration.

[Next Question →]
```
- Background: Light red (#fee2e2)
- Selected option: Red border
- Correct option: Green border
- Explanation: Below options
- Next button: Prominent, blue

### Progress Tracking

**Top Bar**:
- Question number: "Question 3 of 15"
- Progress bar: Visual indicator (20% filled)
- Timer (optional): "5:30 elapsed"

**Bottom Bar**:
- Exit quiz button (confirmation dialog)

### Keyboard Shortcuts (Nice-to-Have)

- **1-4**: Select option A-D
- **Enter**: Submit answer / Next question
- **Esc**: Exit quiz (with confirmation)

---

## Step 4: Results (< 1 minute)

### Score Summary Screen

```
┌──────────────────────────────────────┐
│         Quiz Complete! 🎉            │
├──────────────────────────────────────┤
│                                      │
│     You scored 13/15 (87%)          │
│                                      │
│     ████████████████░░ 87%           │
│                                      │
│  ✓ 13 Correct   ✗ 2 Incorrect       │
│                                      │
│  Time: 8 minutes 32 seconds          │
│                                      │
├──────────────────────────────────────┤
│  [Review Incorrect Questions]        │
│  [Retake Quiz]                       │
│  [Generate New Quiz]                 │
│  [Export Quiz] (optional)            │
└──────────────────────────────────────┘
```

### Breakdown View (Optional)

**Tap "Review Incorrect Questions"**:
```
┌──────────────────────────────────────┐
│ Questions You Missed (2)             │
├──────────────────────────────────────┤
│                                      │
│ Question 7 ✗                         │
│ What is the primary function of...  │
│                                      │
│ Your answer: C. DNA replication      │
│ Correct answer: B. Energy production │
│                                      │
│ [See Explanation]                    │
│                                      │
├──────────────────────────────────────┤
│                                      │
│ Question 12 ✗                        │
│ Which organelle is responsible...   │
│                                      │
│ [See Explanation]                    │
│                                      │
└──────────────────────────────────────┘
```

### Action Buttons

**Review Incorrect Questions**:
- Shows only questions user got wrong
- Displays correct answer + explanation
- Educational, not punitive

**Retake Quiz**:
- Restart same quiz from beginning
- New session ID created
- Tracks improvement over time

**Generate New Quiz**:
- Returns to upload screen
- Keeps current quiz in history

**Export Quiz** (Nice-to-Have):
- Downloads JSON file
- Can be imported later
- Backup in case browser cache cleared

---

## Step 5: Quiz History (Retention)

### History Page

**Purpose**: Show past quizzes, encourage retakes

**Layout**:
```
┌──────────────────────────────────────┐
│ Your Quizzes (5)                     │
├──────────────────────────────────────┤
│                                      │
│ 📄 lecture_05.pdf                   │
│    Cell Biology                      │
│    Last taken: 2 hours ago           │
│    Best score: 87% (13/15)           │
│    [Retake] [View Results]           │
│                                      │
├──────────────────────────────────────┤
│                                      │
│ 📄 chapter_03.pdf                   │
│    Genetics                          │
│    Last taken: 3 days ago            │
│    Best score: 93% (14/15)           │
│    [Retake] [View Results]           │
│                                      │
└──────────────────────────────────────┘

[Generate New Quiz]
```

### Sorting & Filtering (Future)

**Sort By**:
- Recently taken (default)
- Best score
- Lowest score (focus on weak areas)
- Alphabetical

**Search**:
- Search by filename
- Search by topic

---

## Mobile Responsiveness

### Key Principles

1. **Touch-First**: All buttons minimum 44x44px
2. **Readable Text**: Minimum 16px font size
3. **One-Handed**: Important actions within thumb reach
4. **Landscape Support**: Adjust layout for horizontal orientation

### Mobile-Specific Adjustments

**Upload Screen**:
- Larger drop zone (full screen width)
- "Tap to upload" vs "Drop or click"

**Quiz Interface**:
- Larger option buttons (full width)
- Fixed position progress bar (top)
- Fixed position next button (bottom)

**Results Screen**:
- Stacked layout (vertical)
- Full-width action buttons

---

## Accessibility (WCAG 2.1 AA)

### Requirements

**Keyboard Navigation**:
- ✅ Tab through all interactive elements
- ✅ Enter to activate buttons
- ✅ Arrow keys to select options

**Screen Reader Support**:
- ✅ Semantic HTML (proper headings)
- ✅ ARIA labels for custom components
- ✅ Live regions for dynamic content (score updates)

**Visual**:
- ✅ Color contrast ratio ≥ 4.5:1
- ✅ Focus indicators (blue outline)
- ✅ No information conveyed by color alone

**Cognitive**:
- ✅ Clear instructions
- ✅ Confirmation dialogs for destructive actions
- ✅ Progress indicators

---

## Edge Cases & Error Handling

### Edge Case 1: Browser Closes During Quiz

**Problem**: User closes browser mid-quiz, loses progress
**Solution**:
- Auto-save progress after each answer
- On reload, show: "You have an incomplete quiz. Resume or start over?"

### Edge Case 2: PDF Too Short

**Problem**: PDF only has 1 page, not enough content for 10 questions
**Solution**:
- During validation, estimate question capacity
- Show warning: "This PDF might be too short. We'll generate as many questions as possible (minimum 5)."

### Edge Case 3: PDF Has No Extractable Text

**Problem**: Scanned PDF with images only
**Solution**:
- Detect during parsing
- Show error: "This PDF appears to be scanned images. Please upload a text-based PDF."

### Edge Case 4: User Spams "Generate Quiz"

**Problem**: Generates 10 quizzes in 5 minutes, costs spike
**Solution**:
- Client-side rate limiting (5 per hour)
- Show message: "You've generated 5 quizzes in the last hour. Please wait 30 minutes before generating more."

### Edge Case 5: localStorage Full

**Problem**: User has 100+ quizzes, localStorage exceeds 5MB
**Solution**:
- Show warning: "Your browser storage is almost full. Consider exporting old quizzes and clearing history."
- Offer "Export All" button
- Auto-delete quizzes older than 90 days (with confirmation)

---

## Performance Targets

### Page Load Times

- **Homepage**: < 2 seconds (first contentful paint)
- **Quiz page**: < 500ms (already in localStorage)
- **Results page**: < 500ms (calculate score client-side)

### Interaction Responsiveness

- **Answer selection**: < 100ms (instant visual feedback)
- **Next question**: < 200ms (load from memory)
- **Quiz generation**: 30-60 seconds (LLM API constraint)

---

## User Feedback Mechanisms

### In-App Feedback

**Question-Level Feedback**:
- "Report this question" link on each question
- Quick report reasons:
  - Incorrect answer
  - Unclear wording
  - Too easy/hard
  - Other (text input)

**Quiz-Level Feedback**:
- After completing quiz: "How was the quality? ⭐⭐⭐⭐⭐"
- Optional text: "Any specific feedback?"

**General Feedback**:
- Footer link: "Send Feedback"
- Opens Google Form (external)

---

## Retention Hooks

### Immediate Actions (MVP)

1. **Email capture** (optional, Week 7-8):
   - After first quiz: "Want us to remind you to study?"
   - Single input: Email address
   - Frequency: Weekly study reminder

2. **Quiz history**:
   - Always visible on homepage
   - Shows improvement over time
   - Encourages retakes

3. **Performance tracking**:
   - "Your average score: 82%"
   - "You've completed 7 quizzes this week"

### Future Retention Features (Post-MVP)

- Daily streak counter
- Study reminders (email or push notifications)
- Weak area identification ("You struggle with Cell Biology")
- Gamification (badges, achievements)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28

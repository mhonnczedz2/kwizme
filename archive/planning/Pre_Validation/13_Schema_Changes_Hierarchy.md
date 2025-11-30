# QuizMe: Schema Changes for Organizational Hierarchy

**Summary**: Adding Institution → Program → Course → Topic hierarchy requires significant database schema updates.

---

## Impact Assessment

### Complexity Level: **HIGH** 🔴

**Why High Complexity?**
1. Adds 4 new tables (institutions, programs, courses, topics)
2. Requires data migration for existing quizzes
3. Changes core data model significantly
4. Affects multiple components (upload, browse, history)

### Recommendation for MVP

**Option 1: Simplified Approach (Recommended for MVP)** ✅
- Keep flat structure with optional metadata fields
- Add hierarchy later in Phase 2
- Focus on core quiz generation first

**Option 2: Full Implementation** ⚠️
- Implement full hierarchy from start
- Adds 2-3 weeks to timeline
- Risk of scope creep

---

## Detailed Schema Changes

### New Tables Required

```sql
-- Institution (e.g., "UC Berkeley", "MIT")
CREATE TABLE institutions (
    institution_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Program (e.g., "Computer Science BS", "Biology Major")
CREATE TABLE programs (
    program_id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    UNIQUE(institution_id, name)
);

-- Course (e.g., "CS 101", "Biology 201")
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    course_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    UNIQUE(program_id, course_code)
);

-- Topic (e.g., "Cell Biology", "Data Structures")
CREATE TABLE topics (
    topic_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE(course_id, name)
);

-- Performance indexes
CREATE INDEX idx_programs_institution ON programs(institution_id);
CREATE INDEX idx_courses_program ON courses(program_id);
CREATE INDEX idx_topics_course ON topics(course_id);
```

---

### Modified Quizzes Table

```sql
-- Updated quizzes table (add topic_id)
CREATE TABLE quizzes (
    quiz_id TEXT PRIMARY KEY,
    pdf_filename TEXT NOT NULL,

    -- NEW: Hierarchical organization
    topic_id INTEGER,

    -- DEPRECATED: Keep for backward compatibility
    topic TEXT,

    difficulty_level TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE SET NULL
);

CREATE INDEX idx_quizzes_topic ON quizzes(topic_id);
```

---

### Renamed/Updated Session Tracking

```sql
-- Rename review_sessions to quiz_takes (clearer naming)
CREATE TABLE quiz_takes (
    take_id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER,
    score_percentage REAL,
    time_spent_seconds INTEGER,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- Rename answer_records to quiz_answers (clearer naming)
CREATE TABLE quiz_answers (
    answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    take_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (take_id) REFERENCES quiz_takes(take_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
);

-- Updated indexes
CREATE INDEX idx_quiz_takes_quiz ON quiz_takes(quiz_id);
CREATE INDEX idx_quiz_takes_completed ON quiz_takes(completed_at DESC);
CREATE INDEX idx_quiz_answers_take ON quiz_answers(take_id);
CREATE INDEX idx_quiz_answers_question ON quiz_answers(question_id);
```

---

## Data Migration Strategy

### For Existing Quizzes

```sql
-- Create default "Uncategorized" entries
INSERT INTO institutions (name) VALUES ('Uncategorized');
INSERT INTO programs (institution_id, name)
    SELECT institution_id, 'General Studies'
    FROM institutions WHERE name = 'Uncategorized';
INSERT INTO courses (program_id, name, course_code)
    SELECT program_id, 'Uncategorized', 'MISC-000'
    FROM programs WHERE name = 'General Studies';
INSERT INTO topics (course_id, name)
    SELECT course_id, 'General'
    FROM courses WHERE course_code = 'MISC-000';

-- Migrate existing quizzes to default topic
UPDATE quizzes
SET topic_id = (
    SELECT topic_id FROM topics
    WHERE name = 'General'
    LIMIT 1
)
WHERE topic_id IS NULL;
```

---

## New Database Helper Functions

### CRUD for Hierarchy

```typescript
// Institution
async function createInstitution(name: string): Promise<number>;
async function getInstitutions(): Promise<Institution[]>;

// Program
async function createProgram(institutionId: number, name: string): Promise<number>;
async function getProgramsByInstitution(institutionId: number): Promise<Program[]>;

// Course
async function createCourse(programId: number, name: string, courseCode: string): Promise<number>;
async function getCoursesByProgram(programId: number): Promise<Course[]>;

// Topic
async function createTopic(courseId: number, name: string): Promise<number>;
async function getTopicsByCourse(courseId: number): Promise<Topic[]>;

// Quiz organization
async function saveQuizWithHierarchy(
    quiz: QuizData,
    hierarchy: {
        institution: string,
        program: string,
        course: string,
        courseCode: string,
        topic: string
    }
): Promise<string>; // returns quiz_id

// Hierarchy navigation
async function getHierarchyTree(): Promise<HierarchyTree>;
async function getQuizzesByTopic(topicId: number): Promise<Quiz[]>;
async function getQuizzesByHierarchy(
    institutionId?: number,
    programId?: number,
    courseId?: number,
    topicId?: number
): Promise<Quiz[]>;
```

---

## Component Changes Required

### 1. Upload Component (`FileUploadZone.tsx`)

**New Props/State:**
```typescript
interface OrganizationState {
    institution: string;
    institutionId?: number;
    program: string;
    programId?: number;
    course: string;
    courseId?: number;
    courseCode: string;
    topic: string;
}
```

**New UI Elements:**
- 4 dropdown selects (Institution, Program, Course, Topic)
- Auto-populate from database
- Create new entries if not exists

---

### 2. Check Quizzes Component (NEW)

**New Component: `QuizCollection.tsx`**
- Tabs: Recent, Collection
- Hierarchy tree navigation
- Search and filter
- Quiz cards with metadata

**Database Queries:**
```sql
-- Get hierarchy tree with counts
SELECT
    i.institution_id, i.name as institution_name, COUNT(q.quiz_id) as quiz_count
FROM institutions i
LEFT JOIN programs p ON i.institution_id = p.institution_id
LEFT JOIN courses c ON p.program_id = c.program_id
LEFT JOIN topics t ON c.course_id = t.course_id
LEFT JOIN quizzes q ON t.topic_id = q.topic_id
GROUP BY i.institution_id;
```

---

### 3. Quiz History Component (UPDATED)

**Update: `QuizHistory.tsx`**
- Show quiz takes (not just quizzes)
- Display hierarchy breadcrumb (Institution > Program > Course)
- Filter by hierarchy
- Statistics dashboard

**Database Queries:**
```sql
-- Get all quiz takes with hierarchy
SELECT
    qt.take_id,
    qt.quiz_id,
    qt.score_percentage,
    qt.completed_at,
    q.pdf_filename,
    t.name as topic_name,
    c.name as course_name,
    c.course_code,
    p.name as program_name,
    i.name as institution_name
FROM quiz_takes qt
JOIN quizzes q ON qt.quiz_id = q.quiz_id
LEFT JOIN topics t ON q.topic_id = t.topic_id
LEFT JOIN courses c ON t.course_id = c.course_id
LEFT JOIN programs p ON c.program_id = p.program_id
LEFT JOIN institutions i ON p.institution_id = i.institution_id
ORDER BY qt.completed_at DESC;
```

---

## Timeline Impact

### If Implementing Full Hierarchy

**Additional Development Time**: +2-3 weeks

| Task | Time |
|------|------|
| Schema design & migration | 8-12 hours |
| Database helper functions | 12-16 hours |
| Upload UI (hierarchy selects) | 8-12 hours |
| Check Quizzes component | 20-30 hours |
| Quiz History updates | 12-16 hours |
| Testing & debugging | 16-24 hours |
| **Total** | **76-110 hours (2-3 weeks)** |

---

## Simplified Alternative (MVP Recommendation)

### Keep It Simple for MVP ✅

Instead of full hierarchy, use **simple metadata fields**:

```sql
-- Simplified approach (no new tables)
CREATE TABLE quizzes (
    quiz_id TEXT PRIMARY KEY,
    pdf_filename TEXT NOT NULL,

    -- Simple metadata (no foreign keys)
    institution TEXT,
    program TEXT,
    course TEXT,
    course_code TEXT,
    topic TEXT,

    difficulty_level TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simple index for filtering
CREATE INDEX idx_quizzes_course ON quizzes(course);
```

**Benefits:**
- ✅ No complex joins
- ✅ Easy to implement (2-3 days)
- ✅ User can still organize quizzes
- ✅ Can migrate to full hierarchy later

**Drawbacks:**
- ❌ No hierarchy tree navigation
- ❌ Typos create duplicate entries (e.g., "BIO 101" vs "BIO-101")
- ❌ Can't enforce data consistency

---

## Recommendation

### For MVP (Week 1-8): Simple Metadata Approach

**Why:**
1. Validates core hypothesis first (PDF → quiz works)
2. Adds organizational capability without complexity
3. Can upgrade to full hierarchy in Phase 2
4. Keeps timeline on track (6-8 weeks)

### For Phase 2 (Month 3-4): Full Hierarchy

**Why:**
1. User feedback will validate need for hierarchy
2. More time to design proper data model
3. Can add data cleanup tools (merge duplicates)
4. Can add features like course sharing, team collaboration

---

## Decision Matrix

| Feature | Simple Metadata | Full Hierarchy |
|---------|----------------|----------------|
| **Implementation Time** | 2-3 days | 2-3 weeks |
| **Complexity** | Low | High |
| **User Organization** | Yes (manual) | Yes (structured) |
| **Data Consistency** | No | Yes |
| **Hierarchy Tree Nav** | No | Yes |
| **Risk to MVP Timeline** | Low ✅ | High ⚠️ |
| **Upgrade Path** | Easy | N/A |

---

## Next Steps

### If choosing Simple Metadata (Recommended):
1. Add 5 optional text fields to quizzes table
2. Update upload UI with optional inputs
3. Update quiz history to filter by course
4. Ship MVP on time

### If choosing Full Hierarchy:
1. Review this schema document
2. Extend MVP timeline by 2-3 weeks
3. Implement all tables and relationships
4. Build hierarchy navigation UI
5. Add data migration tools

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28
**Related Files**:
- 03_Technical_Architecture.md (original schema)
- 05_User_Flow_UX.md (updated UI flows)
- 12_Implementation_Checklist.md (timeline impact)

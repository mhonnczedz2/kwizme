# Phase 2: Engagement Features - Implementation Plan

**Timeline:** 4-6 weeks
**Features:** Spaced Repetition (#3) + Analytics Dashboard (#4)

---

## Feature #3: Spaced Repetition & Smart Review

### Overview
Transform QuizMe into an intelligent learning system that adapts to user performance and schedules optimal review times.

---

### Part 1: Database Schema Changes

**New Tables:**

```sql
-- Track individual question performance history
CREATE TABLE question_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  user_answered_correctly BOOLEAN NOT NULL,
  confidence_level INTEGER, -- 1-5 scale (1=guessed, 5=very confident)
  time_spent_seconds INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Track spaced repetition scheduling
CREATE TABLE review_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  next_review_date DATETIME NOT NULL,
  interval_days INTEGER NOT NULL, -- Days until next review
  easiness_factor REAL DEFAULT 2.5, -- SM-2 algorithm parameter
  repetition_count INTEGER DEFAULT 0,
  last_reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Track study streaks
CREATE TABLE study_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Modified Tables:**

```sql
-- Add fields to existing quiz_sessions table
ALTER TABLE quiz_sessions ADD COLUMN session_mode TEXT; -- 'learn', 'test', 'fast_learn', 'review_mistakes'
ALTER TABLE quiz_sessions ADD COLUMN reviewed_question_ids TEXT; -- JSON array of question IDs reviewed
```

---

### Part 2: Spaced Repetition Algorithm (SM-2)

**File:** `/lib/algorithms/spaced-repetition.ts`

Implement the SM-2 algorithm:

```typescript
interface ReviewData {
  easiness_factor: number;
  interval_days: number;
  repetition_count: number;
}

export function calculateNextReview(
  currentData: ReviewData,
  quality: number, // 0-5: user's confidence/correctness rating
  wasCorrect: boolean
): ReviewData {
  // SM-2 Algorithm implementation
  // - Quality 0-2: Reset interval (incorrect answer)
  // - Quality 3-5: Increase interval based on easiness factor
  // - Adjust easiness factor based on performance

  // Returns: new easiness_factor, interval_days, repetition_count
}

export function getQuestionsForReview(
  currentDate: Date
): Promise<Question[]> {
  // Query review_schedule table for questions due today or overdue
}

export function getWeakAreaQuestions(
  limit: number
): Promise<Question[]> {
  // Query questions with low success rate from question_performance
}
```

**Why SM-2?**
- Proven algorithm used by Anki, SuperMemo
- Balances review frequency with long-term retention
- Adapts to individual learning pace

---

### Part 3: New Quiz Mode - "Review Mistakes"

**File:** `/components/QuizConfigModal.tsx`

Add new preset mode:

```typescript
const PRESETS = {
  // ... existing presets
  review_mistakes: {
    quick_submit: false,
    show_explanation: true,
    randomize_options: false,
    randomize_questions: true,
    preset_name: 'review_mistakes'
  }
}
```

**File:** `/app/page.tsx`

Add new button to home screen:

```tsx
<button
  onClick={() => startReviewMode()}
  className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all"
>
  <div className="bg-white/20 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
    <span className="text-3xl md:text-4xl">🔄</span>
  </div>
  <h3 className="text-xl md:text-2xl font-bold mb-2">Review Due</h3>
  <p className="text-purple-100 text-sm md:text-base">
    {dueQuestionsCount} questions waiting
  </p>
</button>
```

**Logic:**
1. Query `review_schedule` for questions due today
2. If none due, query `question_performance` for questions with <70% accuracy
3. Generate quiz session with only those questions
4. After session, update `review_schedule` based on performance

---

### Part 4: Confidence Rating UI

**File:** `/components/ConfidenceRating.tsx` (new component)

```tsx
interface ConfidenceRatingProps {
  onRate: (confidence: number) => void;
  wasCorrect: boolean;
}

export default function ConfidenceRating({ onRate, wasCorrect }: ConfidenceRatingProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        How confident were you?
      </h4>
      <div className="flex gap-2 justify-between">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => onRate(level)}
            className="flex-1 px-3 py-2 rounded-lg border-2 hover:bg-blue-50 transition-all min-h-[44px]"
          >
            <div className="text-xl mb-1">{getEmoji(level)}</div>
            <div className="text-xs text-gray-600">{getLabel(level)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function getEmoji(level: number): string {
  const emojis = ['😰', '😕', '😐', '😊', '😎'];
  return emojis[level - 1];
}

function getLabel(level: number): string {
  const labels = ['Guessed', 'Unsure', 'Okay', 'Confident', 'Very Sure'];
  return labels[level - 1];
}
```

**Integration in QuizDisplay.tsx:**
- Show confidence rating after answering in Learn and Review modes
- Skip in Test mode (to maintain exam simulation)
- Save confidence rating to `question_performance` table

---

### Part 5: Study Streak Tracking

**File:** `/lib/db/streak-storage.ts` (new file)

```typescript
export async function updateStreak(): Promise<void> {
  // Check last_study_date
  // If yesterday: increment current_streak
  // If today: do nothing
  // If older: reset current_streak to 1
  // Update longest_streak if needed
}

export async function getStreakData(): Promise<{
  current: number;
  longest: number;
  lastStudyDate: Date;
}> {
  // Query study_streaks table
}
```

**Display Location:**
- Add streak counter to home page header
- Show flame emoji 🔥 with current streak number
- Celebrate milestones (7-day, 30-day, 100-day streaks)

---

### Part 6: Smart Recommendations

**File:** `/lib/algorithms/recommendations.ts` (new file)

```typescript
export interface Recommendation {
  type: 'weak_topic' | 'due_review' | 'new_material';
  title: string;
  description: string;
  quizId?: number;
  questionIds?: number[];
  priority: 'high' | 'medium' | 'low';
}

export async function generateRecommendations(): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // 1. Check for overdue reviews
  const overdueCount = await getOverdueReviewCount();
  if (overdueCount > 0) {
    recommendations.push({
      type: 'due_review',
      title: `${overdueCount} questions need review`,
      description: 'Stay on track with your spaced repetition schedule',
      priority: 'high'
    });
  }

  // 2. Identify weak topics (categories with <70% accuracy)
  const weakTopics = await getWeakTopics();
  for (const topic of weakTopics) {
    recommendations.push({
      type: 'weak_topic',
      title: `Practice ${topic.name}`,
      description: `Current accuracy: ${topic.accuracy}%`,
      quizId: topic.quizId,
      priority: 'medium'
    });
  }

  // 3. Suggest new material (quizzes not taken yet)
  const untakenQuizzes = await getUntakenQuizzes();
  if (untakenQuizzes.length > 0) {
    recommendations.push({
      type: 'new_material',
      title: 'Try new material',
      description: `${untakenQuizzes.length} quizzes haven't been started yet`,
      priority: 'low'
    });
  }

  return recommendations;
}
```

**UI Location:**
- Home page: recommendations card below main actions
- Dashboard page: dedicated recommendations section

---

## Feature #4: Analytics Dashboard

### Overview
Visual progress tracking with charts and performance insights.

---

### Part 1: New Route and Page

**File:** `/app/analytics/page.tsx` (new file)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getAnalyticsData } from '@/lib/db/analytics-storage';
import ScoreTrendChart from '@/components/analytics/ScoreTrendChart';
import CategoryBreakdown from '@/components/analytics/CategoryBreakdown';
import StudyStats from '@/components/analytics/StudyStats';
import WeakAreas from '@/components/analytics/WeakAreas';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            📊 Analytics
          </h1>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {['7d', '30d', '90d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <StudyStats data={analyticsData} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ScoreTrendChart data={analyticsData?.scoreTrend} />
          <CategoryBreakdown data={analyticsData?.categoryStats} />
        </div>

        {/* Weak Areas */}
        <WeakAreas data={analyticsData?.weakAreas} />
      </div>
    </div>
  );
}
```

---

### Part 2: Analytics Data Aggregation

**File:** `/lib/db/analytics-storage.ts` (new file)

```typescript
export interface AnalyticsData {
  totalQuizzes: number;
  totalQuestions: number;
  averageScore: number;
  totalTimeMinutes: number;
  scoreTrend: { date: string; score: number }[];
  categoryStats: { category: string; accuracy: number; count: number }[];
  weakAreas: { topic: string; accuracy: number; needsReview: boolean }[];
  recentSessions: SessionSummary[];
}

export async function getAnalyticsData(
  timeRange: '7d' | '30d' | '90d' | 'all'
): Promise<AnalyticsData> {
  const db = await initDB();
  const cutoffDate = calculateCutoffDate(timeRange);

  // Aggregate data from quiz_sessions, questions, quizzes tables

  // 1. Total stats
  const totalQuizzes = await db.prepare(
    'SELECT COUNT(*) FROM quiz_sessions WHERE created_at > ?'
  ).bind(cutoffDate).first();

  // 2. Score trend (daily aggregation)
  const scoreTrend = await db.prepare(`
    SELECT
      DATE(completed_at) as date,
      AVG(score * 100.0 / total_questions) as score
    FROM quiz_sessions
    WHERE completed_at > ? AND completed_at IS NOT NULL
    GROUP BY DATE(completed_at)
    ORDER BY date ASC
  `).bind(cutoffDate).all();

  // 3. Category breakdown
  const categoryStats = await db.prepare(`
    SELECT
      q.category,
      COUNT(*) as count,
      AVG(CASE WHEN qs.score > 0 THEN 100.0 ELSE 0 END) as accuracy
    FROM quiz_sessions qs
    JOIN quizzes q ON qs.quiz_id = q.id
    WHERE qs.completed_at > ?
    GROUP BY q.category
  `).bind(cutoffDate).all();

  // 4. Weak areas (categories with <70% accuracy)
  const weakAreas = categoryStats
    .filter(cat => cat.accuracy < 70)
    .map(cat => ({
      topic: cat.category,
      accuracy: cat.accuracy,
      needsReview: true
    }));

  return {
    totalQuizzes,
    totalQuestions,
    averageScore,
    totalTimeMinutes,
    scoreTrend,
    categoryStats,
    weakAreas,
    recentSessions
  };
}
```

---

### Part 3: Chart Components

**Libraries to Install:**
```bash
npm install recharts
```

**File:** `/components/analytics/ScoreTrendChart.tsx` (new component)

```tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScoreTrendChartProps {
  data: { date: string; score: number }[];
}

export default function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Score Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-sm text-gray-600 mt-2">
        Track your quiz performance over time
      </p>
    </div>
  );
}
```

**File:** `/components/analytics/CategoryBreakdown.tsx` (new component)

```tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryBreakdownProps {
  data: { category: string; accuracy: number; count: number }[];
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Performance by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="accuracy" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-sm text-gray-600 mt-2">
        See which topics you excel at and which need more practice
      </p>
    </div>
  );
}
```

**File:** `/components/analytics/StudyStats.tsx` (new component)

```tsx
interface StudyStatsProps {
  data: {
    totalQuizzes: number;
    totalQuestions: number;
    averageScore: number;
    totalTimeMinutes: number;
  };
}

export default function StudyStats({ data }: StudyStatsProps) {
  const stats = [
    { label: 'Quizzes Completed', value: data?.totalQuizzes || 0, icon: '📝', color: 'blue' },
    { label: 'Questions Answered', value: data?.totalQuestions || 0, icon: '❓', color: 'purple' },
    { label: 'Average Score', value: `${Math.round(data?.averageScore || 0)}%`, icon: '🎯', color: 'green' },
    { label: 'Study Time', value: `${Math.round((data?.totalTimeMinutes || 0) / 60)}h`, icon: '⏱️', color: 'orange' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-2">{stat.icon}</div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
```

---

### Part 4: Navigation Updates

**File:** `/app/page.tsx`

Add Analytics button to home screen:

```tsx
<button
  onClick={() => router.push('/analytics')}
  className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all"
>
  <div className="bg-white/20 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
    <span className="text-3xl md:text-4xl">📊</span>
  </div>
  <h3 className="text-xl md:text-2xl font-bold mb-2">Analytics</h3>
  <p className="text-green-100 text-sm md:text-base">
    Track your progress
  </p>
</button>
```

---

## Implementation Order

### Week 1-2: Spaced Repetition Foundation
1. ✅ Database schema changes (tables, migrations)
2. ✅ Implement SM-2 algorithm (`spaced-repetition.ts`)
3. ✅ Create question performance tracking system
4. ✅ Build review schedule logic

### Week 2-3: Review Mode UI
5. ✅ Add "Review Mistakes" preset to QuizConfigModal
6. ✅ Create ConfidenceRating component
7. ✅ Integrate confidence rating into QuizDisplay
8. ✅ Add "Review Due" button to home screen
9. ✅ Implement study streak tracking and display

### Week 3-4: Smart Recommendations
10. ✅ Build recommendation algorithm
11. ✅ Create recommendations UI component
12. ✅ Integrate into home page

### Week 4-5: Analytics Dashboard
13. ✅ Install recharts library
14. ✅ Create analytics data aggregation functions
15. ✅ Build analytics page route
16. ✅ Create chart components (ScoreTrendChart, CategoryBreakdown)
17. ✅ Build StudyStats component
18. ✅ Create WeakAreas component

### Week 5-6: Polish & Testing
19. ✅ Add Analytics navigation button
20. ✅ Mobile responsiveness for all new components
21. ✅ Test spaced repetition algorithm accuracy
22. ✅ User testing and feedback
23. ✅ Performance optimization
24. ✅ Documentation updates

---

## Success Metrics

Track these to measure Phase 2 success:

- **Retention:** 7-day return rate (target: 40%+)
- **Engagement:** Sessions per week (target: 3+)
- **Feature Adoption:** % using Review mode (target: 60%+)
- **Streaks:** Average streak length (target: 7+ days)
- **Analytics:** % viewing analytics page (target: 50%+)
- **Learning Effectiveness:** Average score improvement over 30 days (target: 15%+)

---

## Technical Considerations

### Performance
- Index `review_schedule.next_review_date` for fast queries
- Cache analytics data (recalculate daily, not on every page load)
- Paginate question performance history

### Data Migration
- Existing users: backfill `review_schedule` with initial data
- Set all existing questions to "due for review" on first login after update

### Mobile Responsiveness
- All new components must follow Phase 1 mobile-first patterns
- Charts must be responsive (use ResponsiveContainer)
- Touch-friendly confidence rating buttons (44×44px)

---

## Future Enhancements (Phase 3+)

After Phase 2 is complete, consider:
- Custom review schedules (daily vs. weekly learners)
- Topic-based goals ("Master Biology by March")
- Social features (compare streaks with friends)
- Export analytics as PDF reports
- Integration with calendar for study reminders

---

*Last Updated: 2025-01-29*

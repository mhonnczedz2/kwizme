# QuizMe: Metrics, Validation & Success Criteria

---

## North Star Metric

**Quizzes Completed per Week**

**Why This Metric?**
- Measures core value delivery (users actually taking quizzes)
- Combines acquisition + activation + engagement
- Leading indicator of retention
- Easy to track without complex analytics

**Target**:
- Week 1: 10 completed quizzes
- Week 4: 50 completed quizzes
- Week 8: 100+ completed quizzes

---

## Key Performance Indicators (KPIs)

### Acquisition Metrics

#### 1. Total Signups
**Definition**: Unique visitors who upload at least one PDF

**How to Track**: Vercel serverless logs (count unique IPs or device IDs)

**Targets**:
- Week 4: 20 users
- Week 8: 100 users

**Why It Matters**: Validates demand (are people trying it?)

---

#### 2. Source Attribution
**Definition**: Where users came from (Reddit, referral, Product Hunt, etc.)

**How to Track**:
- URL parameters (`?ref=reddit`)
- Manual survey question: "How did you hear about us?"

**Why It Matters**: Understand which channels work best

---

### Activation Metrics

#### 3. Generation Success Rate
**Definition**: % of PDF uploads that successfully generate a quiz

**Formula**: `(Successful generations / Total upload attempts) × 100`

**How to Track**: Serverless function logs (success vs. error responses)

**Target**: ≥90%

**Why It Matters**: Validates technical reliability

---

#### 4. Quiz Start Rate
**Definition**: % of generated quizzes that are started (at least 1 question answered)

**Formula**: `(Quizzes started / Quizzes generated) × 100`

**How to Track**: Client-side anonymous ping when first question answered

**Target**: ≥80%

**Why It Matters**: Measures engagement after generation

---

#### 5. Time to First Question
**Definition**: Average time from PDF upload to answering first question

**Target**: <90 seconds (60s generation + 30s navigation)

**Why It Matters**: Speed is a core value prop

---

### Engagement Metrics

#### 6. Quiz Completion Rate
**Definition**: % of started quizzes that are completed (all questions answered)

**Formula**: `(Quizzes completed / Quizzes started) × 100`

**How to Track**: Client-side anonymous ping when quiz completed

**Target**: ≥60%

**Why It Matters**: Validates quiz quality and engagement

**Benchmarks**:
- <20%: Boring/broken (red flag)
- 20-40%: Mediocre engagement
- 40-60%: Good engagement
- >60%: Excellent engagement

---

#### 7. Questions Answered per Quiz
**Definition**: Average number of questions answered before abandoning

**Target**: ≥12 (out of 15)

**Why It Matters**: Shows where users drop off

---

#### 8. Average Quiz Score
**Definition**: Average percentage score across all completed quizzes

**Target**: 60-80%

**Why It Matters**: Indicates difficulty level
- <50%: Too hard (frustrating)
- 50-70%: Good challenge
- 70-85%: Sweet spot
- >90%: Too easy (boring)

---

### Retention Metrics

#### 9. Repeat Usage Rate
**Definition**: % of users who generate 2+ quizzes

**Formula**: `(Users with 2+ quizzes / Total users) × 100`

**How to Track**: Count unique device IDs with multiple quizzes in database

**Target**: ≥20%

**Why It Matters**: Strong signal of product-market fit

**Benchmarks**:
- <10%: No retention (red flag)
- 10-20%: Weak retention
- 20-40%: Good retention
- >40%: Strong retention

---

#### 10. Day 1 Return Rate
**Definition**: % of users who return the day after first use

**Target**: ≥10%

**Why It Matters**: Early retention indicator

---

#### 11. Day 7 Return Rate
**Definition**: % of users who return within 7 days

**Target**: ≥20%

**Why It Matters**: Week-over-week retention

---

#### 12. Day 30 Return Rate
**Definition**: % of users who return within 30 days

**Target**: ≥10%

**Why It Matters**: Long-term retention potential

---

### Quality Metrics

#### 13. Average Question Quality Rating
**Definition**: User rating of question quality (1-5 stars)

**How to Track**: Post-quiz feedback prompt: "How was the question quality? ⭐⭐⭐⭐⭐"

**Target**: ≥4.0/5.0

**Why It Matters**: Validates AI output quality

**Benchmarks**:
- <3.0: Poor quality (pivot needed)
- 3.0-3.5: Mediocre quality
- 3.5-4.0: Good quality
- >4.0: Excellent quality

---

#### 14. Question Report Rate
**Definition**: % of questions flagged as incorrect/unclear

**Formula**: `(Reported questions / Total questions) × 100`

**Target**: <5%

**Why It Matters**: Identifies quality issues

---

#### 15. NPS (Net Promoter Score)
**Definition**: "How likely are you to recommend QuizMe to a friend?" (0-10)

**How to Track**: Survey after 2nd quiz

**Target**: ≥40

**Calculation**:
- Promoters (9-10): 60%
- Passives (7-8): 30%
- Detractors (0-6): 10%
- NPS = 60% - 10% = 50

**Benchmarks**:
- <0: Crisis
- 0-30: Needs improvement
- 30-50: Good
- >50: Excellent

---

## Success Criteria (Go/No-Go Decision)

### ✅ Success Signals (Go to Phase 2)

**Quantitative** (any 3 of 5):
1. ✅ **100+ quizzes generated** (proves people try it)
2. ✅ **60%+ quiz completion rate** (proves engagement)
3. ✅ **20%+ repeat usage rate** (proves retention potential)
4. ✅ **4.0/5.0+ avg quality rating** (proves AI is good enough)
5. ✅ **40+ NPS** (proves strong word-of-mouth potential)

**Qualitative** (both required):
1. ✅ **Positive feedback from 70%+ of beta testers**
2. ✅ **Clear understanding of target user** (who wants this and why)

**If 3+ quantitative + both qualitative → GO TO PHASE 2**

---

### ❌ Failure Signals (Pivot or Kill)

**Critical Red Flags** (any 1 = pivot/kill):
1. ❌ **<50 quizzes generated in 4 weeks** (no demand)
2. ❌ **<20% quiz completion rate** (boring/broken)
3. ❌ **<10% repeat usage rate** (no retention)
4. ❌ **<3.0/5.0 quality rating** (AI too poor)
5. ❌ **Majority negative feedback** (UX or concept broken)

**If 1+ critical red flag → PIVOT OR KILL**

---

### 🔄 Pivot Scenarios

**Scenario 1: Low Engagement (Boring Quizzes)**
- **Signal**: 100+ generated, but <20% completion
- **Root Cause**: Questions too easy, too hard, or irrelevant
- **Pivot**: Improve prompt engineering, add difficulty selection, or switch to flashcards

**Scenario 2: No Demand (Low Generation Count)**
- **Signal**: <50 generated despite marketing efforts
- **Root Cause**: Students don't have PDFs, or don't want quizzes
- **Pivot**: Accept photos of notes, or switch to flashcard generation

**Scenario 3: Poor Quality (Low Ratings)**
- **Signal**: High usage, but <3.0 quality rating
- **Root Cause**: LLM output is inaccurate or unclear
- **Pivot**: Switch LLM provider, fine-tune model, or add human review layer

**Scenario 4: One-Time Use (No Retention)**
- **Signal**: 100+ generated, but <10% repeat usage
- **Root Cause**: No reason to return (novelty wore off)
- **Pivot**: Add spaced repetition, reminders, or social features

---

## Tracking Strategy (MVP)

### Manual Tracking (Week 1-4)

**Why Manual?**
- No analytics platform needed (avoid complexity)
- Cheap (free)
- Good enough for MVP validation

**How**:
1. **Serverless logs**: Count quiz generations (Vercel dashboard)
2. **Database queries**: Count quizzes, sessions, answers (SQL.js exports)
3. **Google Form**: Collect qualitative feedback
4. **User interviews**: 1:1 calls with beta testers

**Weekly Metrics Review**:
- Export SQL.js database (JSON)
- Run queries to calculate metrics
- Update Google Sheet dashboard
- Review with team (or self)

---

### Semi-Automated Tracking (Week 5-8)

**Add Anonymous Pings**:
- When quiz started: `POST /api/analytics/quiz-started`
- When quiz completed: `POST /api/analytics/quiz-completed`
- No PII, just anonymous counters

**Vercel Logs**:
- Monitor serverless function invocations
- Track error rates
- Calculate generation success rate

**Google Form**:
- Post-quiz feedback (optional)
- NPS survey (after 2nd quiz)

---

### Automated Tracking (Phase 2)

**Add Analytics Platform**:
- PostHog (free tier, 1M events)
- Mixpanel (free tier, 100K events)
- Amplitude (free tier, 10M events)

**Track Events**:
- `pdf_uploaded`
- `quiz_generated`
- `quiz_started`
- `question_answered`
- `quiz_completed`
- `quiz_retaken`

**Benefits**:
- Real-time dashboards
- Cohort analysis
- Funnel visualization
- Retention curves

---

## Metrics Dashboard (Google Sheets)

### Structure

**Sheet 1: Overview**
| Metric | Week 1 | Week 2 | Week 3 | Week 4 | Week 5-8 | Target | Status |
|--------|--------|--------|--------|--------|----------|--------|--------|
| Quizzes Generated | 5 | 12 | 28 | 45 | 120 | 100 | ✅ |
| Completion Rate | 40% | 55% | 62% | 68% | 70% | 60% | ✅ |
| Repeat Usage | 0% | 15% | 18% | 22% | 25% | 20% | ✅ |
| Quality Rating | 3.8 | 4.1 | 4.2 | 4.3 | 4.4 | 4.0 | ✅ |
| NPS | - | - | 35 | 42 | 48 | 40 | ✅ |

**Sheet 2: User Interviews**
| User | Date | Feedback Summary | NPS | Would Pay? |
|------|------|------------------|-----|------------|
| User 1 | 2025-11-28 | "Love the speed, questions a bit easy" | 9 | Yes, $5/mo |
| User 2 | 2025-11-29 | "Great for studying, want dark mode" | 8 | Maybe, $3/mo |

**Sheet 3: Raw Data**
| Week | Uploads | Generations | Started | Completed | Repeat Users |
|------|---------|-------------|---------|-----------|--------------|
| 1 | 8 | 5 | 4 | 2 | 0 |
| 2 | 15 | 12 | 10 | 6 | 2 |

---

## User Feedback Collection

### In-App Feedback

**Post-Quiz Survey** (optional, non-blocking):
```
Thanks for completing the quiz! 🎉

How was the question quality?
⭐ ⭐ ⭐ ⭐ ⭐ (click to rate)

Any feedback? (optional)
[Text input]

[Submit] [Skip]
```

**After 2nd Quiz** (NPS):
```
Welcome back! 👋

How likely are you to recommend QuizMe to a friend?

0  1  2  3  4  5  6  7  8  9  10
Not likely            Very likely

[Submit]
```

---

### External Feedback Form (Google Form)

**Questions**:
1. How did you hear about QuizMe?
2. What's your role? (Student, Teacher, Other)
3. How many quizzes have you generated?
4. Overall experience rating (1-5 stars)
5. Question quality rating (1-5 stars)
6. What did you like most?
7. What was most frustrating?
8. What features are missing?
9. Would you use this regularly? (Yes/No/Maybe)
10. Would you pay for this? If yes, how much per month?

**Link**: Shared in Reddit post, beta tester emails

---

### User Interview Questions

**Interview Length**: 30 minutes

**Questions**:
1. **Background**: Tell me about your studying habits. What subjects?
2. **Discovery**: How did you find QuizMe? What made you try it?
3. **Experience**: Walk me through your first time using QuizMe.
4. **Value**: What problem does QuizMe solve for you?
5. **Quality**: How accurate/relevant were the generated questions?
6. **Usage**: How often would you use this? When? Why?
7. **Missing**: What features are missing? What would make this better?
8. **Willingness to Pay**: If this cost $5/month, would you pay? Why or why not?
9. **Recommendation**: Would you recommend this to friends? Who?
10. **Open**: Anything else you want to share?

**Goal**: 5-10 interviews, mix of heavy users and drop-offs

---

## Cohort Analysis (Future)

### Weekly Cohorts

**Example**:
| Cohort | Week 0 | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|--------|
| Nov 28 | 100% | 30% | 20% | 15% | 10% |
| Dec 5 | 100% | 35% | 25% | 18% | - |
| Dec 12 | 100% | 40% | 28% | - | - |

**Insight**: Retention improving week-over-week (good sign)

---

## Benchmarking

### Industry Standards

**SaaS Products**:
- Day 1 retention: 30-40%
- Day 7 retention: 15-25%
- Day 30 retention: 10-15%

**Education Apps**:
- Day 1 retention: 20-30%
- Day 7 retention: 10-20%
- Day 30 retention: 5-10%

**Consumer Apps**:
- Day 1 retention: 40-60%
- Day 7 retention: 20-30%
- Day 30 retention: 10-20%

**QuizMe Targets** (conservative):
- Day 1: 10%
- Day 7: 20%
- Day 30: 10%

---

## Go/No-Go Decision Framework

### Week 8 Evaluation

**Step 1: Calculate Metrics**
- [ ] Total quizzes generated
- [ ] Quiz completion rate
- [ ] Repeat usage rate
- [ ] Average quality rating
- [ ] NPS score

**Step 2: Compare to Targets**
- [ ] 100+ quizzes? ✅/❌
- [ ] 60%+ completion? ✅/❌
- [ ] 20%+ repeat? ✅/❌
- [ ] 4.0+ quality? ✅/❌
- [ ] 40+ NPS? ✅/❌

**Step 3: Review Qualitative Feedback**
- [ ] Majority positive? ✅/❌
- [ ] Clear target user? ✅/❌

**Step 4: Make Decision**
- **Go**: 3+ quantitative ✅ + both qualitative ✅ → Continue to Phase 2
- **Pivot**: 1-2 quantitative ✅ + issues identified → Adjust and retest
- **Kill**: 0 quantitative ✅ or critical red flag → Stop project

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28

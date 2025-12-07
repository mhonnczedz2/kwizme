# QuizMe Analytics Implementation

**Date:** December 6, 2024
**GA4 Property ID:** G-79NFTLZH6L
**Implementation Status:** ✅ Complete

## Overview

This document outlines the Google Analytics 4 implementation for QuizMe, including all tracked events and their parameters. The analytics system provides comprehensive insights into user behavior, business metrics, and technical performance.

## Implementation Details

### Core Setup
- **Package:** `@next/third-parties/google`
- **Tracking:** Production only (excludes development data)
- **Location:** GA4 script loaded in `app/layout.tsx`
- **Utilities:** Type-safe tracking functions in `lib/analytics.ts`

### Event Tracking Architecture

All events include:
- Automatic timestamp
- Environment filtering (production only)
- Type-safe parameters
- Category organization

## Tracked Events

### 1. Quiz Generation Events

#### `quiz_generated`
**Triggers:** Successful quiz creation
**Location:** `app/api/generate-quiz/route.ts`
```typescript
Parameters:
- file_type: string (e.g., 'application/pdf', 'image/jpeg')
- difficulty: 'easy' | 'medium' | 'hard'
- num_questions: number (10-50)
- user_type: 'anonymous' | 'authenticated'
- file_size_mb: number (rounded to 2 decimals)
- event_category: 'quiz_generation'
```

#### `rate_limit_hit`
**Triggers:** User reaches daily quiz generation limit
**Location:** `app/api/generate-quiz/route.ts`
```typescript
Parameters:
- current_count: number
- daily_limit: number
- user_type: 'anonymous' | 'authenticated'
- plan_type: string ('free', 'premium', 'unlimited')
- event_category: 'monetization'
```

### 2. Quiz Completion Events

#### `quiz_completed`
**Triggers:** Quiz session completion
**Location:** `lib/session-storage-router.ts`
```typescript
Parameters:
- quiz_id: string
- score: number (correct answers)
- total_questions: number
- score_percentage: number (0-100)
- mode: string ('learn', 'test', 'fast_learn', 'custom')
- time_spent_seconds: number
- completion_rate: number (0-100)
- event_category: 'quiz_engagement'
```

### 3. User Lifecycle Events

#### `user_signup`
**Triggers:** Successful account creation
**Location:** `app/auth/signup/page.tsx`
```typescript
Parameters:
- source: string ('direct', 'referral', etc.)
- referrer: string (referring URL)
- has_existing_data: boolean
- event_category: 'user_lifecycle'
```

### 4. Error Tracking Events

#### `error_occurred`
**Triggers:** API errors, client errors, validation failures
**Location:** `app/api/generate-quiz/route.ts`, other error boundaries
```typescript
Parameters:
- error_type: 'api_error' | 'client_error' | 'network_error' | 'validation_error'
- error_message: string (truncated to 100 chars)
- error_code: string | number (optional)
- context: string (where error occurred)
- event_category: 'errors'
```

## Additional Events (Ready to Implement)

### File Upload Events
```typescript
// trackFileUploaded()
- file_type: string
- file_size_mb: number
- page_count: number (optional)
- processing_time_ms: number (optional)
- event_category: 'file_processing'
```

### Quiz Interaction Events
```typescript
// trackQuizStarted()
- quiz_id: string
- mode: string
- randomize_questions: boolean
- randomize_options: boolean
- num_questions: number
- event_category: 'quiz_engagement'

// trackQuestionAnswered()
- quiz_id: string
- question_index: number
- is_correct: boolean
- time_spent_seconds: number
- hint_used: boolean
- event_category: 'quiz_engagement'
```

### Feedback Events
```typescript
// trackFeedbackSubmitted()
- rating: number (1-5, optional)
- feedback_type: 'bug' | 'feature' | 'general' | 'rating'
- source: 'post_quiz' | 'error_state' | 'rate_limit' | 'header'
- has_text: boolean
- event_category: 'user_feedback'
```

### Premium Upgrade Events
```typescript
// trackPremiumUpgrade()
- from_plan: string
- to_plan: string
- trigger: 'rate_limit' | 'feature_gate' | 'marketing' | 'other'
- upgrade_value: number (optional)
- event_category: 'monetization'
```

## Key Business Metrics

### Conversion Funnel
1. **File Upload** → `file_uploaded`
2. **Quiz Generation** → `quiz_generated`
3. **Quiz Start** → `quiz_started`
4. **Quiz Completion** → `quiz_completed`
5. **Rate Limit Hit** → `rate_limit_hit`
6. **User Signup** → `user_signup`
7. **Premium Upgrade** → `premium_upgrade`

### Core KPIs Tracked
- **Quiz Generation Rate:** Daily quiz generations per user
- **Completion Rate:** % of started quizzes completed
- **User Conversion:** Anonymous → Registered users
- **Premium Conversion:** Free → Paid users
- **Error Rates:** Technical issues and user friction
- **Engagement:** Time spent, questions answered

## GA4 Dashboard Setup

### Recommended Custom Events
Create these in GA4 > Events > Create Event:

1. **Quiz Funnel Completion**
   - Condition: `quiz_completed` with score_percentage > 70%

2. **High-Value User**
   - Condition: `quiz_generated` count > 5 (per day)

3. **Conversion Opportunity**
   - Condition: `rate_limit_hit` event

4. **Premium Candidate**
   - Condition: `quiz_generated` count > 3 AND user_type = 'authenticated'

### Custom Dimensions
Set up these custom dimensions in GA4:

1. **User Type** (user_type parameter)
2. **Quiz Difficulty** (difficulty parameter)
3. **Quiz Mode** (mode parameter)
4. **File Type** (file_type parameter)
5. **Plan Type** (plan_type parameter)

### Goals & Conversions
Mark these events as conversions in GA4:

1. `user_signup` - User acquisition conversion
2. `premium_upgrade` - Revenue conversion
3. `quiz_completed` - Engagement conversion

## Monitoring & Alerts

### Real-Time Monitoring
Monitor these metrics in GA4 Real-Time:
- Active users taking quizzes
- Quiz generation events
- Error rates
- New user signups

### Recommended Alerts
Set up GA4 Intelligence alerts for:
- Sudden drop in quiz_generated events (>20% decrease)
- Spike in error_occurred events (>50% increase)
- Increase in rate_limit_hit events (conversion opportunity)
- Drop in completion rates (user experience issue)

## Data Privacy & Compliance

### GDPR/CCPA Compliance
- No personally identifiable information (PII) tracked
- User IDs are anonymous session identifiers
- File names and content not tracked in analytics
- Users can opt out via browser settings

### Data Retention
- GA4 default: 14 months
- Can be configured: 2-14 months
- Event parameters: Same as event retention

## Testing & Validation

### How to Test Events (Development)
```javascript
// Test in browser console (production only)
if (window.gtag) {
  window.gtag('event', 'test_event', {
    event_category: 'testing',
    test_parameter: 'test_value'
  });
}
```

### Validation Checklist
- [ ] Events appear in GA4 Real-Time reports
- [ ] Parameters are captured correctly
- [ ] No events fired in development environment
- [ ] All event categories are consistent
- [ ] No PII data is being tracked

## Troubleshooting

### Common Issues
1. **Events not showing:** Check production environment, GA4 property ID
2. **Missing parameters:** Verify function imports and parameter names
3. **Duplicate events:** Check for multiple gtag installations
4. **Development data:** Ensure `NODE_ENV === 'production'` check

### Debug Mode
Enable GA4 debug mode:
```javascript
// Add to browser console
window.gtag('config', 'G-79NFTLZH6L', {
  debug_mode: true
});
```

## Next Steps

### Phase 2 Implementation (Week 2-3)
1. Add feedback tracking to feedback modal
2. Implement quiz interaction events (start, question answers)
3. Add file upload tracking
4. Set up premium upgrade tracking
5. Create custom GA4 dashboard

### Advanced Analytics (Month 2)
1. Cohort analysis setup
2. User journey mapping
3. A/B testing framework integration
4. Revenue attribution modeling
5. Predictive analytics for churn

---

**Last Updated:** December 6, 2024
**Next Review:** January 6, 2025 (post-launch analysis)
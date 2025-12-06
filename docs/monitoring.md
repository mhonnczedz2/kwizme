# QuizMe Error Monitoring & Performance Implementation

**Date:** December 6, 2024
**Sentry DSN:** `https://c679b2e5b1f0733ab079eafdfdad66ef@o4510488656936960.ingest.us.sentry.io/4510488663556096`
**Implementation Status:** ✅ Complete

## Overview

This document outlines the comprehensive error monitoring and performance tracking implementation for QuizMe using Sentry for error tracking and Vercel Speed Insights for Core Web Vitals monitoring.

## Implementation Details

### Sentry Error Monitoring
- **Package:** `@sentry/nextjs`
- **Environment:** Production only (excludes development noise)
- **Sampling:** 10% performance tracing in production, 100% in development
- **Session Replay:** 10% of sessions, 100% of sessions with errors

### Performance Monitoring
- **Package:** `@vercel/speed-insights`
- **Metrics:** Core Web Vitals (LCP, FID, CLS, TTFB, FCP, INP)
- **Integration:** Vercel dashboard with real-time insights

## Configuration Files

### Core Sentry Configuration

#### `sentry.client.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://c679b2e5b1f0733ab079eafdfdad66ef@o4510488656936960.ingest.us.sentry.io/4510488663556096',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

#### `sentry.server.config.ts` & `sentry.edge.config.ts`
- Similar configuration for server-side and edge runtime error capture
- Production-only error collection
- Environment tagging for proper issue categorization

#### `next.config.js` Integration
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  org: "quizme-app",
  project: "quizme-app",
  tunnelRoute: "/monitoring", // Bypasses ad-blockers
  hideSourceMaps: true,
  disableLogger: true, // Tree-shake in production
});
```

## Error Handling Implementation

### Enhanced Analytics Integration
**Location:** `lib/analytics.ts`

```typescript
export const trackError = (params: {
  errorType: 'api_error' | 'client_error' | 'network_error' | 'validation_error';
  errorMessage: string;
  errorCode?: string | number;
  context?: string;
  error?: Error; // Actual error object for Sentry
}) => {
  // Track in GA4 for business metrics
  trackEvent('error_occurred', { /* GA4 parameters */ });

  // Send detailed context to Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', params.errorType);
      scope.setTag('context', params.context || 'unknown');
      scope.setLevel('error');

      if (params.error) {
        Sentry.captureException(params.error);
      } else {
        Sentry.captureMessage(params.errorMessage, 'error');
      }
    });
  }
};
```

### Error Boundary Component
**Location:** `components/ErrorBoundary.tsx`

**Features:**
- Automatic error capture with React Error Boundaries
- User-friendly fallback UI with refresh option
- Sentry integration with component context
- Higher-order component wrapper for easy integration

**Usage:**
```tsx
// Wrap critical components
<ErrorBoundary context="quiz-generation">
  <QuizGenerator />
</ErrorBoundary>

// Or use HOC pattern
export default withErrorBoundary(MyComponent, 'component-context');
```

## Monitoring Coverage

### API Route Error Tracking
**Implementation:** Enhanced existing API routes

#### Quiz Generation API (`app/api/generate-quiz/route.ts`)
```typescript
} catch (error: any) {
  trackError({
    errorType: 'api_error',
    errorMessage: error.message || 'Unknown quiz generation error',
    context: 'quiz_generation',
    error: error // Sends full error object to Sentry
  });

  return NextResponse.json(
    { error: error.message || 'Internal server error' },
    { status: 500 }
  );
}
```

### Client-Side Error Boundaries
- **Quiz Components:** Error boundaries around quiz generation and display
- **Authentication:** Error handling for login/signup flows
- **File Upload:** Error capture for file processing issues
- **Session Management:** Error tracking for quiz session operations

## Performance Monitoring

### Core Web Vitals Tracking
**Integration:** `app/layout.tsx`
```tsx
{process.env.NODE_ENV === 'production' && (
  <>
    <GoogleAnalytics gaId="G-79NFTLZH6L" />
    <SpeedInsights />
  </>
)}
```

### Monitored Metrics
1. **Largest Contentful Paint (LCP)** - Loading performance
2. **First Input Delay (FID)** - Interactivity
3. **Cumulative Layout Shift (CLS)** - Visual stability
4. **Time to First Byte (TTFB)** - Server response time
5. **First Contentful Paint (FCP)** - Initial load speed
6. **Interaction to Next Paint (INP)** - Runtime responsiveness

## Alert Configuration

### Sentry Alert Rules (Recommended Setup)

#### High Priority Alerts
1. **API Error Spike**
   - Condition: >10 errors in 5 minutes
   - Context: `quiz_generation`, `user_auth`
   - Notification: Email + Slack

2. **Client Error Rate**
   - Condition: Error rate >5% over 10 minutes
   - Notification: Email

3. **Performance Degradation**
   - Condition: Average response time >2 seconds
   - Context: API routes
   - Notification: Email

#### Medium Priority Alerts
1. **New Error Types**
   - Condition: First-time error signatures
   - Notification: Email (daily digest)

2. **User Impact**
   - Condition: >100 users affected by same error
   - Notification: Email

### Performance Alert Thresholds
**Vercel Speed Insights Dashboard:**
- **LCP Warning:** >2.5 seconds
- **FID Warning:** >100 milliseconds
- **CLS Warning:** >0.1
- **TTFB Warning:** >800 milliseconds

## Error Categories & Contexts

### Error Types Tracked
1. **`api_error`** - Server-side API failures
   - Quiz generation failures
   - Database connection issues
   - External API timeouts (Gemini, Supabase)

2. **`client_error`** - Browser-side JavaScript errors
   - Component rendering failures
   - State management issues
   - Browser compatibility problems

3. **`network_error`** - Network-related failures
   - API request timeouts
   - Connection interruptions
   - CORS issues

4. **`validation_error`** - Data validation failures
   - File upload validation
   - Form input validation
   - Schema validation errors

### Context Tags
- **`quiz_generation`** - AI quiz creation process
- **`user_auth`** - Authentication and authorization
- **`file_upload`** - File processing and validation
- **`session_management`** - Quiz sessions and answers
- **`rate_limiting`** - Usage limits and restrictions

## Dashboard Setup

### Sentry Dashboard Configuration

#### Key Widgets
1. **Error Rate Over Time** - Daily error trends
2. **Top Errors by Volume** - Most frequent issues
3. **Top Errors by Users Affected** - High-impact problems
4. **Performance Issues** - Slow transactions
5. **Release Health** - Error rates by deployment

#### Custom Queries
```sql
-- High-impact errors affecting multiple users
error.type:* AND user.affected:>=10

-- API-specific errors
error.context:quiz_generation OR error.context:user_auth

-- Performance issues
transaction.duration:>=2000

-- Recent errors (last 24h)
event.timestamp:>=2024-12-06T00:00:00
```

### Performance Dashboard
**Vercel Speed Insights:** Automatic dashboard with:
- Real User Monitoring (RUM) data
- Geographic performance breakdown
- Device/browser performance comparison
- Core Web Vitals trends over time

## Debugging & Troubleshooting

### Error Investigation Process

#### 1. Triage (Sentry Dashboard)
- Check error frequency and user impact
- Review stack traces and error context
- Identify if error is new or recurring

#### 2. Context Analysis
- Review Sentry tags and context data
- Check related performance data
- Analyze user journey and affected features

#### 3. Reproduction
- Use Sentry's session replay for visual debugging
- Check browser/device specific patterns
- Reproduce in staging environment

#### 4. Resolution Tracking
- Link fixes to Sentry releases
- Monitor error resolution post-deployment
- Update alert thresholds based on learnings

### Common Error Patterns

#### Quiz Generation Failures
**Symptoms:** `api_error` in `quiz_generation` context
**Common Causes:**
- Gemini API rate limits or timeouts
- Large file processing issues
- Invalid file formats

**Investigation:**
```typescript
// Check error context in Sentry
error.context === 'quiz_generation'
error.errorCode // HTTP status or API error code
error.errorMessage // Specific failure reason
```

#### Authentication Issues
**Symptoms:** `client_error` or `api_error` in `user_auth` context
**Common Causes:**
- Supabase session expiration
- Email verification issues
- CSRF token problems

#### Performance Issues
**Symptoms:** High response times in Speed Insights
**Common Causes:**
- Large file uploads without chunking
- Unoptimized database queries
- Client-side bundle size issues

## Next Steps & Optimization

### Phase 2 Enhancements (Week 2-3)
1. **Custom Error Pages** - Branded 404/500 pages with error tracking
2. **User Feedback Integration** - Error report collection from users
3. **Advanced Alerting** - PagerDuty integration for critical issues
4. **Performance Budgets** - Automated performance regression detection

### Advanced Monitoring (Month 2)
1. **Business Metrics Correlation** - Link errors to revenue impact
2. **Predictive Alerting** - Machine learning for anomaly detection
3. **User Journey Tracking** - Full user flow error mapping
4. **Capacity Planning** - Load testing and monitoring integration

## Data Privacy & Compliance

### PII Handling
- **No sensitive data** captured in error logs
- **File contents** not included in error reports
- **User emails** only in controlled contexts with user consent
- **Session data** anonymized for debugging

### Data Retention
- **Sentry:** 90 days for free tier, configurable for paid plans
- **Speed Insights:** 30 days retention, aggregated metrics only
- **Error context:** No personally identifiable information stored

## Cost & Scaling

### Current Usage (Free Tiers)
- **Sentry:** 5,000 errors/month, 10,000 performance transactions
- **Speed Insights:** Unlimited (included with Vercel)

### Scaling Considerations
- **Error volume:** Monitor error rates vs. user growth
- **Performance data:** Sampling rates adjustable based on traffic
- **Alert fatigue:** Tune thresholds as application matures

---

**Last Updated:** December 6, 2024
**Next Review:** January 6, 2025 (post-launch optimization)
**Monitoring Status:** ✅ Production Ready
# QuizMe: Cost Structure & Financial Analysis

---

## Development Costs (One-Time)

### Solo Founder Scenario

| Item | Cost | Notes |
|------|------|-------|
| Developer time (200-250 hours @ $0 if solo) | **$0** | Sweat equity |
| Domain name (optional) | **$12/year** | quizme.com or quizme.app |
| Designer (contract, optional) | $500-1000 | Skip for MVP, use TailwindUI components |
| **Total Initial Investment** | **$0-1012** | Can start with $12 only |

### With Contracted Developer

| Item | Cost | Notes |
|------|------|-------|
| Developer time (200-250 hours @ $50/hour) | **$10,000-12,500** | US contractor rate |
| Domain name | **$12/year** | Required |
| Designer (contract, optional) | $500-1000 | Optional |
| **Total Initial Investment** | **$10,512-13,512** | |

**Recommendation**: Start solo, validate, then scale with team

---

## Monthly Operating Costs

### MVP Phase (0-100 users)

| Service | Free Tier | Projected Usage | Cost |
|---------|-----------|-----------------|------|
| **Vercel Hosting** | 100GB bandwidth | ~10GB used | **$0/month** |
| **Vercel Serverless Functions** | 100GB-hours | ~20GB-hours | **$0/month** |
| **LLM API (Gemini Flash)** | No free tier | 100 quizzes/month × $0.001 | **$0.10/month** |
| **Email (SendGrid)** | 100 emails/day | 50 emails/month | **$0/month** |
| **Analytics (PostHog)** | 1M events | 5K events | **$0/month** |
| **Domain** | N/A | quizme.com | **$1/month** |
| **Total** | | | **~$1-3/month** |

**Key Insight**: Nearly zero cost during validation phase

---

### Growth Phase (100-1,000 users)

| Service | Cost |
|---------|------|
| **Vercel Hosting** | $0/month (still in free tier) |
| **Vercel Serverless Functions** | $0-20/month (may exceed free tier) |
| **LLM API (Gemini Flash)** | 1,000 quizzes × $0.001 = **$1/month** |
| **Email (SendGrid)** | 500 emails/month = **$0/month** (free tier) |
| **Analytics (PostHog)** | 50K events = **$0/month** (free tier) |
| **Domain** | $1/month |
| **Total** | **$2-22/month** |

**Key Insight**: Can support 1,000 users for <$25/month

---

### Scale Phase (1,000-10,000 users)

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel Hosting (Pro Plan)** | $20/month | 1TB bandwidth |
| **Vercel Serverless Functions** | $50-100/month | 1000GB-hours |
| **LLM API** | 10,000 quizzes × $0.001 = **$10/month** | Gemini Flash |
| **Email (SendGrid)** | 5,000 emails/month = **$15/month** | Paid tier |
| **Analytics (PostHog)** | 500K events = **$0-20/month** | Paid tier starts at 1M events |
| **Domain** | $1/month | |
| **Database (Supabase)** | $25/month | For cloud sync (Phase 3) |
| **Total** | **$121-191/month** | |

**Revenue Needed**: 25 paying users @ $4.99/month = $125/month → **Profitable**

---

## Cost Per Quiz Analysis

### Gemini Flash (Recommended)

**Pricing**:
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

**Average Quiz**:
- Input: 2,000 tokens (2-page PDF)
- Output: 3,000 tokens (15 questions with explanations)

**Calculation**:
```
Input cost: 2,000 × $0.075 / 1,000,000 = $0.00015
Output cost: 3,000 × $0.30 / 1,000,000 = $0.0009
Total per quiz: ~$0.001
```

**Monthly Cost Examples**:
- 100 quizzes/month: $0.10
- 1,000 quizzes/month: $1.00
- 10,000 quizzes/month: $10.00

---

### GPT-4o-mini (Fallback)

**Pricing**:
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**Average Quiz**:
- Input: 2,000 tokens
- Output: 3,000 tokens

**Calculation**:
```
Input cost: 2,000 × $0.15 / 1,000,000 = $0.0003
Output cost: 3,000 × $0.60 / 1,000,000 = $0.0018
Total per quiz: ~$0.002
```

**Monthly Cost Examples**:
- 100 quizzes/month: $0.20
- 1,000 quizzes/month: $2.00
- 10,000 quizzes/month: $20.00

**Cost Difference**: GPT-4o-mini is 2x more expensive than Gemini Flash

---

## Cost Control Measures

### Hard Spend Caps

**LLM Provider Dashboard**:
1. Set monthly budget alert: $50
2. Set hard limit: $100
3. Email alerts at 50%, 75%, 90% usage

**Application-Level**:
1. Rate limiting: 5 generations per device per hour
2. Circuit breaker: Pause if monthly cost exceeds $100
3. Daily cost monitoring: Alert if >$5/day

---

### Rate Limiting Strategy

**Per-Device Limit** (Client-Side):
- 5 generations per hour
- Tracked via localStorage
- Honor system (not secure, but good enough for MVP)

**Per-IP Limit** (Server-Side Backup):
- 5 generations per hour per IP
- Map of IP → timestamp array
- Reject requests exceeding limit

**Rationale**:
- Prevents abuse (single user generating 100 quizzes)
- Controls costs (predictable spending)
- Fair usage (5 quizzes/hour is generous for students)

---

## Revenue Projections (Post-MVP)

### Freemium Model (Phase 3)

**Free Tier**:
- 5 quizzes/month
- All core features
- Local storage only

**Premium Tier ($4.99/month)**:
- Unlimited quizzes
- Cloud sync
- Priority support
- Export to Anki/CSV

---

### User Acquisition Funnel

**Assumptions**:
- 1,000 monthly visitors (organic + word-of-mouth)
- 20% sign up (200 users)
- 10% convert to premium (20 paying users)

**Monthly Revenue**:
```
20 paying users × $4.99 = $99.80/month
```

**Monthly Costs** (at 1,000 users):
```
LLM API: $1
Vercel: $20
Email: $15
Domain: $1
Total: $37/month
```

**Monthly Profit**: $99.80 - $37 = **$62.80/month**

**Not huge, but validates willingness to pay**

---

### Growth Scenarios

#### Conservative (Year 1)
- Month 3: 200 users, 10 paying → $50/month revenue
- Month 6: 500 users, 25 paying → $125/month revenue
- Month 9: 1,000 users, 50 paying → $250/month revenue
- Month 12: 2,000 users, 100 paying → $500/month revenue

**Year 1 Total Revenue**: ~$2,000
**Year 1 Total Costs**: ~$500
**Year 1 Profit**: ~$1,500 (barely profitable, validates model)

---

#### Moderate (Year 1)
- Month 3: 500 users, 25 paying → $125/month revenue
- Month 6: 2,000 users, 100 paying → $500/month revenue
- Month 9: 5,000 users, 250 paying → $1,250/month revenue
- Month 12: 10,000 users, 500 paying → $2,500/month revenue

**Year 1 Total Revenue**: ~$12,000
**Year 1 Total Costs**: ~$2,000
**Year 1 Profit**: ~$10,000 (side income level)

---

#### Aggressive (Year 1)
- Month 3: 1,000 users, 50 paying → $250/month revenue
- Month 6: 5,000 users, 250 paying → $1,250/month revenue
- Month 9: 15,000 users, 750 paying → $3,750/month revenue
- Month 12: 30,000 users, 1,500 paying → $7,500/month revenue

**Year 1 Total Revenue**: ~$40,000
**Year 1 Total Costs**: ~$5,000
**Year 1 Profit**: ~$35,000 (full-time income potential)

---

## Unit Economics

### Customer Acquisition Cost (CAC)

**MVP Phase (Organic)**:
- Reddit posts: $0
- Word of mouth: $0
- Product Hunt: $0
- **CAC: $0**

**Growth Phase (Paid Ads)**:
- Google Ads: $1-2 per click
- Conversion rate: 50% (click → sign up)
- **CAC: $2-4 per user**

---

### Lifetime Value (LTV)

**Assumptions**:
- Premium: $4.99/month
- Average retention: 12 months (academic year)
- Churn rate: 8% per month

**LTV Calculation**:
```
LTV = ARPU × Average Lifetime
LTV = $4.99 × 12 months = $59.88
```

**LTV:CAC Ratio**:
```
Organic: $59.88 / $0 = ∞ (no paid acquisition)
Paid Ads: $59.88 / $4 = 14.97:1 (healthy, >3:1 is good)
```

**Conclusion**: Strong unit economics, viable business model

---

## Break-Even Analysis

### Question: How many paying users to break even?

**Monthly Fixed Costs**:
- Vercel Pro: $20
- Email: $15
- Domain: $1
- Analytics: $10
- **Total Fixed: $46**

**Variable Cost per User**:
- LLM API: $0.01/month (10 quizzes/month × $0.001)
- Negligible

**Revenue per Paying User**:
- $4.99/month

**Break-Even Calculation**:
```
Fixed Costs / (Revenue - Variable Cost) = Break-Even Users
$46 / ($4.99 - $0.01) = 9.24 users
```

**Break-Even: 10 paying users** → $50/month revenue

**Key Insight**: Very low break-even point, risk is minimal

---

## Cost Optimization Strategies

### 1. LLM Cost Reduction

**Switch to Cheaper Models**:
- Gemini Flash (current): $0.001/quiz
- Gemini Flash 8B (future): $0.0005/quiz (50% savings)
- Total savings at 10K quizzes: $5/month

**Prompt Optimization**:
- Reduce output tokens (shorter explanations)
- Reduce input tokens (extract only relevant PDF sections)
- Savings: 20-30%

**Caching**:
- Cache quizzes for popular textbooks
- Reduces redundant LLM calls
- Savings: 30-50% for popular content

---

### 2. Infrastructure Cost Reduction

**Vercel Free Tier Maximization**:
- Optimize bundle size (reduce bandwidth)
- Use CDN caching (reduce serverless invocations)
- Stay under 100GB-hours limit

**Alternative Hosting** (if needed):
- Cloudflare Pages: Free unlimited bandwidth
- Netlify: Free 100GB bandwidth
- Trade-off: Less integrated than Vercel

---

### 3. Email Cost Reduction

**Minimize Email Sends**:
- Only send when user opts in
- Batch weekly digests (vs. daily)
- Use free tier limits wisely (100 emails/day = 3,000/month)

**Alternative Providers**:
- Resend: 3,000 emails/month free
- Mailgun: 5,000 emails/month free
- SendGrid: 100 emails/day free

---

## Financial Risk Assessment

### Risk 1: LLM Cost Spike

**Scenario**: Viral growth, 100,000 quizzes in one month
**Cost Impact**: $100 LLM API bill
**Mitigation**:
- Hard spend cap at $100
- Rate limiting (5 per hour per user)
- Circuit breaker (pause generation if cap hit)

**Likelihood**: Low (rate limiting prevents)

---

### Risk 2: Vercel Bandwidth Overrun

**Scenario**: 100,000 visitors in one month
**Cost Impact**: Exceed free tier, $20-50 overage charges
**Mitigation**:
- Optimize bundle size (keep <500KB)
- Use CDN caching
- Upgrade to Pro plan proactively ($20/month)

**Likelihood**: Low (unlikely to hit 100K visitors in MVP phase)

---

### Risk 3: No Revenue (No One Pays)

**Scenario**: Users love free tier, no one converts to premium
**Cost Impact**: No revenue to offset costs ($50/month operating cost)
**Mitigation**:
- Keep costs ultra-low during validation
- Only add premium features if users show willingness to pay
- Pivot to sponsorship/ads model if needed

**Likelihood**: Medium (most common failure mode)

---

## Funding Strategy

### Bootstrap (Recommended)

**Phase 1 (MVP)**: $0-50 initial investment
- Use free tiers
- Solo development
- Validate before spending

**Phase 2 (Growth)**: $500-1,000 investment
- Paid ads ($500)
- Designer ($500)
- Still bootstrapped

**Phase 3 (Scale)**: $5,000-10,000 investment
- Hire contractor ($5K)
- Marketing budget ($5K)
- Consider angel round if traction strong

---

### Angel/Pre-Seed (If Needed)

**Raise Amount**: $50,000-100,000
**Use of Funds**:
- Developer salaries: $30K (6 months runway)
- Marketing: $20K (paid acquisition)
- Infrastructure: $5K (premium tools)
- Buffer: $10K (emergencies)

**When to Raise**: After 1,000 active users, 10%+ conversion to premium

---

## Cost Tracking Dashboard

### Key Metrics to Monitor

1. **LLM Cost per Quiz**: $0.001 target
2. **Monthly LLM Spend**: Track daily, alert if >$5/day
3. **Vercel Bandwidth**: Track weekly, stay under 100GB/month
4. **Serverless Invocations**: Track weekly, stay under 100GB-hours
5. **Email Sends**: Track daily, stay under 100/day

### Tools

- **Vercel Dashboard**: Real-time usage metrics
- **Google AI Studio**: Token usage, cost breakdown
- **Google Sheets**: Manual cost tracking, projections

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28

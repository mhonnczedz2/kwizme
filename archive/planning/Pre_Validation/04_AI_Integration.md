# QuizMe: AI Integration Strategy

---

## LLM Provider Selection

### Recommended: Google Gemini 1.5 Flash

**Primary Choice**: Gemini 1.5 Flash
- **Cost**: $0.075 per 1M input tokens, $0.30 per 1M output tokens
- **Speed**: ~2-3 seconds for 15-question quiz
- **Quality**: Excellent for MCQ generation
- **Context**: 1M token context window (way more than needed)

**Fallback**: OpenAI GPT-4o-mini
- **Cost**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Speed**: ~3-4 seconds for 15-question quiz
- **Quality**: Slightly better than Gemini for complex reasoning
- **Context**: 128k token context window (sufficient)

### Cost Comparison (per quiz)

**Assumptions**:
- Average PDF: 2,000 tokens input
- Average quiz: 3,000 tokens output (15 questions with explanations)

**Gemini Flash**:
- Input: 2,000 tokens × $0.075 / 1M = $0.00015
- Output: 3,000 tokens × $0.30 / 1M = $0.0009
- **Total: ~$0.001 per quiz**

**GPT-4o-mini**:
- Input: 2,000 tokens × $0.15 / 1M = $0.0003
- Output: 3,000 tokens × $0.60 / 1M = $0.0018
- **Total: ~$0.002 per quiz**

### Decision: Start with Gemini Flash
- 50% cheaper than GPT-4o-mini
- Faster response time
- Easy to swap if quality issues arise

---

## Prompt Engineering

### Base Prompt Template

```python
base_prompt = """
You are an expert educator creating multiple choice questions for students.
Generate questions that test comprehension, application, and analysis.

From this document, generate {num_questions} multiple choice questions.

Each question must have:
- 1 correct answer (provide the actual answer text)
- 3 plausible distractors (wrong answers that seem reasonable)
- Brief explanation of why the answer is correct
- Optional hint (helpful clue without giving away the answer)
- Difficulty rating based on cognitive complexity

Return ONLY valid JSON in this exact format:
{
  "quiz_id": "generated-uuid",
  "pdf_filename": "{filename}",
  "topic": "extracted topic",
  "difficulty_level": "medium",
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

Document text:
{pdf_text}
"""
```

### Difficulty-Specific Prompts

**Easy**:
```
Focus on recall and basic comprehension:
- Simple definitions
- Key facts and dates
- Direct quotes from text
- Obvious relationships
```

**Medium** (default):
```
Focus on application and analysis:
- Conceptual understanding
- Relationships between ideas
- Inference from context
- Problem-solving scenarios
```

**Hard**:
```
Focus on synthesis and evaluation:
- Compare and contrast concepts
- Analyze complex scenarios
- Apply knowledge to novel situations
- Critique arguments
```

### Context Hints

If user provides context hint, prepend to prompt:
```
Additional context from the user: "{context_hint}"

Use this context to generate more relevant questions.
```

---

## JSON Schema Validation

### Expected Response Schema

```typescript
interface QuizResponse {
  quiz_id: string;           // UUID format
  pdf_filename: string;      // Original filename
  topic: string;             // Extracted topic (1-3 words)
  difficulty_level: "easy" | "medium" | "hard";
  questions: Question[];
}

interface Question {
  question: string;                     // 10-200 characters
  options: [string, string, string, string]; // Exactly 4 options
  correct_answer: string;               // Must match one of the options exactly
  explanation: string;                  // 20-300 characters
  hint?: string;                        // Optional, 10-100 characters
  difficulty: "easy" | "medium" | "hard";
}
```

### Validation Rules

```typescript
function validateQuizResponse(response: any): QuizResponse {
  // 1. Schema validation
  if (!response.quiz_id || !response.questions) {
    throw new Error("Missing required fields");
  }

  // 2. Questions array validation
  if (!Array.isArray(response.questions) || response.questions.length === 0) {
    throw new Error("Invalid questions array");
  }

  // 3. Each question validation
  response.questions.forEach((q, i) => {
    // Options must be array of 4 strings
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question ${i}: Invalid options`);
    }

    // Correct answer must match one of the options
    if (!q.options.includes(q.correct_answer)) {
      throw new Error(`Question ${i}: correct_answer "${q.correct_answer}" not found in options`);
    }

    // Question length check
    if (q.question.length < 10 || q.question.length > 200) {
      throw new Error(`Question ${i}: Question too short/long`);
    }

    // Explanation length check
    if (q.explanation.length < 20 || q.explanation.length > 300) {
      throw new Error(`Question ${i}: Explanation too short/long`);
    }

    // Hint length check (if provided)
    if (q.hint && (q.hint.length < 10 || q.hint.length > 100)) {
      throw new Error(`Question ${i}: Hint too short/long`);
    }

    // Difficulty validation
    if (!["easy", "medium", "hard"].includes(q.difficulty)) {
      throw new Error(`Question ${i}: Invalid difficulty level`);
    }
  });

  return response as QuizResponse;
}
```

---

## Quality Assurance Checks

### Automated Checks (Run Before Returning to Client)

**1. Uniqueness Check**
```typescript
function checkUniqueness(questions: Question[]): boolean {
  const questionTexts = questions.map(q => q.question.toLowerCase());
  const uniqueTexts = new Set(questionTexts);
  return questionTexts.length === uniqueTexts.size;
}
```

**2. Correct Answer Validation**
```typescript
function checkCorrectAnswerValid(question: Question): boolean {
  // Ensure correct_answer exists in options array
  return question.options.includes(question.correct_answer);
}
```

**3. Distractor Quality Check**
```typescript
function checkDistractorQuality(question: Question): boolean {
  const { options, correct_answer } = question;

  // Check that distractors aren't obviously wrong
  // (e.g., not just "none of the above" or "all of the above")
  const obviouslyWrong = ["none of the above", "all of the above", "i don't know"];

  const distractors = options.filter(option => option !== correct_answer);
  return !distractors.some(d =>
    obviouslyWrong.some(wrong => d.toLowerCase().includes(wrong))
  );
}
```

**4. Explanation Relevance Check**
```typescript
function checkExplanationRelevance(question: Question): boolean {
  const { question: q, explanation, correct_answer } = question;

  // Explanation should mention the correct answer or key concept
  const lowerExplanation = explanation.toLowerCase();
  const keywords = correct_answer.toLowerCase().split(' ').filter(w => w.length > 3);

  return keywords.some(keyword => lowerExplanation.includes(keyword));
}
```

### Quality Score Calculation

```typescript
function calculateQualityScore(quiz: QuizResponse): number {
  let score = 100;

  // Deduct points for issues
  if (!checkUniqueness(quiz.questions)) score -= 20;

  quiz.questions.forEach(q => {
    if (!checkCorrectAnswerValid(q)) score -= 10;
    if (!checkDistractorQuality(q)) score -= 5;
    if (!checkExplanationRelevance(q)) score -= 5;
  });

  return Math.max(0, score);
}
```

### Quality Threshold

- **Pass**: Quality score ≥ 70 → return to user
- **Retry**: Quality score < 70 → regenerate once
- **Fail**: Second attempt < 70 → return with warning banner

---

## Retry Strategy

### When to Retry

1. **JSON parsing error** (malformed response)
2. **Validation error** (missing fields, wrong types)
3. **Quality score < 70** (poor question quality)

### Retry Logic

```typescript
async function generateQuizWithRetry(
  pdfText: string,
  numQuestions: number,
  maxRetries: number = 1
): Promise<QuizResponse> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    try {
      const response = await callLLM(pdfText, numQuestions);
      const validated = validateQuizResponse(response);
      const qualityScore = calculateQualityScore(validated);

      if (qualityScore >= 70) {
        return validated;
      } else if (attempt < maxRetries) {
        // Log and retry
        console.log(`Low quality score (${qualityScore}), retrying...`);
        attempt++;
      } else {
        // Return with warning
        return {
          ...validated,
          warning: "Quiz quality below threshold. Questions may be suboptimal."
        };
      }
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        attempt++;
      } else {
        throw new Error(`Quiz generation failed after ${maxRetries + 1} attempts: ${lastError.message}`);
      }
    }
  }

  throw new Error("Unexpected error in retry logic");
}
```

---

## Error Handling

### Error Types

```typescript
enum QuizGenerationError {
  PDF_PARSE_ERROR = "Failed to extract text from PDF",
  LLM_API_ERROR = "LLM API request failed",
  VALIDATION_ERROR = "Generated quiz failed validation",
  TIMEOUT_ERROR = "Quiz generation timed out",
  RATE_LIMIT_ERROR = "Rate limit exceeded"
}
```

### User-Facing Error Messages

```typescript
const errorMessages = {
  PDF_PARSE_ERROR: {
    title: "Couldn't read this PDF",
    message: "This PDF format isn't supported. Try exporting it from Google Docs or Word.",
    retry: true
  },
  LLM_API_ERROR: {
    title: "Generation failed",
    message: "Our AI service is temporarily unavailable. Please try again in a minute.",
    retry: true
  },
  VALIDATION_ERROR: {
    title: "Quiz quality issue",
    message: "The generated quiz didn't meet quality standards. Try uploading a different PDF section.",
    retry: true
  },
  TIMEOUT_ERROR: {
    title: "Generation took too long",
    message: "This PDF might be too long. Try uploading 5-10 pages instead.",
    retry: true
  },
  RATE_LIMIT_ERROR: {
    title: "Too many requests",
    message: "You've generated 5 quizzes in the last hour. Please wait before generating more.",
    retry: false
  }
};
```

---

## Rate Limiting

### Strategy

**Per-Device Limit**: 5 generations per hour
- **Why**: Prevent abuse, control costs
- **How**: localStorage timestamp tracking (client-side honor system)
- **Enforcement**: Serverless function checks IP address (backup)

### Implementation

**Client-Side**:
```typescript
function checkRateLimit(): boolean {
  const key = 'quiz_generation_timestamps';
  const timestamps = JSON.parse(localStorage.getItem(key) || '[]');
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  // Remove old timestamps
  const recentTimestamps = timestamps.filter(t => t > oneHourAgo);

  if (recentTimestamps.length >= 5) {
    return false; // Rate limited
  }

  // Add current timestamp
  recentTimestamps.push(Date.now());
  localStorage.setItem(key, JSON.stringify(recentTimestamps));
  return true;
}
```

**Server-Side** (backup):
```typescript
const rateLimitMap = new Map<string, number[]>();

function checkServerRateLimit(ip: string): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const timestamps = rateLimitMap.get(ip) || [];
  const recentTimestamps = timestamps.filter(t => t > oneHourAgo);

  if (recentTimestamps.length >= 5) {
    return false;
  }

  recentTimestamps.push(now);
  rateLimitMap.set(ip, recentTimestamps);
  return true;
}
```

---

## Cost Control Measures

### Hard Spend Cap

**LLM Provider Dashboard**:
- Set monthly budget alert: $50
- Set hard limit: $100
- Email alerts at 50%, 75%, 90%

### Per-Quiz Cost Tracking

```typescript
interface CostMetrics {
  total_quizzes_generated: number;
  total_cost_usd: number;
  avg_cost_per_quiz: number;
  last_updated: Date;
}

function trackQuizCost(inputTokens: number, outputTokens: number) {
  const inputCost = inputTokens * (0.075 / 1_000_000);
  const outputCost = outputTokens * (0.30 / 1_000_000);
  const totalCost = inputCost + outputCost;

  // Log to Vercel analytics or simple JSON file
  console.log(`Quiz cost: $${totalCost.toFixed(6)}`);

  // Update metrics
  updateCostMetrics(totalCost);
}
```

### Circuit Breaker

If costs spike unexpectedly, pause quiz generation:

```typescript
async function generateQuizWithCircuitBreaker(pdfText: string) {
  const currentCost = await getCurrentMonthCost();

  if (currentCost > 100) {
    throw new Error("Monthly budget exceeded. Service temporarily paused.");
  }

  return generateQuiz(pdfText);
}
```

---

## Monitoring & Observability

### Key Metrics to Track

1. **Generation success rate**: % of successful quiz generations
2. **Average generation time**: Time from PDF upload to quiz ready
3. **Average cost per quiz**: LLM API cost per quiz
4. **Quality score distribution**: How often do we get high-quality quizzes?
5. **Retry rate**: How often do we need to retry generation?

### Logging Strategy

```typescript
interface QuizGenerationLog {
  timestamp: Date;
  pdf_filename: string;
  pdf_size_bytes: number;
  num_questions_requested: number;
  num_questions_generated: number;
  generation_time_ms: number;
  quality_score: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  retry_count: number;
  error?: string;
}
```

**Where to log**:
- Development: `console.log`
- Production: Vercel serverless logs (accessible via dashboard)
- Future: PostHog or LogRocket for advanced analytics

---

## Future Improvements (Post-MVP)

### Model Fine-Tuning
- Collect user feedback on question quality
- Fine-tune Gemini or GPT model on high-quality examples
- Expected improvement: 10-20% better question relevance

### Multi-Model Strategy
- Use cheap model (Gemini Flash) for generation
- Use expensive model (GPT-4) for validation
- Cost: +$0.001 per quiz, but higher quality

### Caching Common Topics
- Cache quiz templates for popular textbooks
- Reduces LLM calls by 50% for repeat content
- Implementation: Hash PDF content, check cache first

### Difficulty Calibration
- Track user performance per question
- Adjust difficulty ratings based on actual data
- Improve future quiz quality

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28

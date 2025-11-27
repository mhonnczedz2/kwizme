# QuizMe - AI Quiz Generator

Generate practice quizzes from your PDFs using AI.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
quizme/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (serverless functions)
│   │   └── generate-quiz/ # Quiz generation endpoint
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # React components
│   └── FileUploadZone.tsx
├── lib/                   # Utilities and libraries
│   └── db/               # Database utilities
│       ├── client.ts     # SQL.js client
│       ├── schema.ts     # Database schema
│       └── types.ts      # TypeScript types
├── Pre_Validation/       # Planning documentation
└── Post_Validation/      # Growth plan
```

## 🗄️ Database Architecture

QuizMe uses **SQL.js** (client-side SQLite) for local data storage:

- **No server required** - All quiz data stored in browser
- **Offline-capable** - Works without internet after quiz generation
- **Privacy-first** - Your data never leaves your device

### Schema

See `/lib/db/schema.ts` for complete database schema including:
- `quizzes` - Generated quiz metadata
- `questions` - Quiz questions with text-based answers
- `review_sessions` - Quiz attempt history with configuration
- `answer_records` - Individual answer tracking

## 🎯 Development Roadmap

### Week 1-2: Project Setup & Database ✅
- [x] Next.js + TypeScript + TailwindCSS setup
- [x] SQL.js database initialization
- [x] Database schema implementation
- [x] Basic file upload component

### Week 3-4: Core Features ✅
- [x] PDF text extraction
- [x] LLM API integration (Gemini 2.5 Flash)
- [x] Quiz generation endpoint
- [ ] Quiz display interface
- [ ] Answer checking logic

### Week 5-6: Polish & PWA
- [ ] Quiz configuration modal
- [ ] Session presets (Learn/Test/Fast Learn)
- [ ] Quiz history view
- [ ] PWA manifest and service worker
- [ ] Offline support

### Week 7-8: Beta Launch
- [ ] Testing and bug fixes
- [ ] Performance optimization
- [ ] Beta user onboarding
- [ ] Feedback collection

## 📖 Documentation

Comprehensive planning documentation available in `/Pre_Validation/`:

- **01_Executive_Summary.md** - Overview and timeline
- **02_Product_Definition.md** - Features and scope
- **03_Technical_Architecture.md** - Tech stack and schema
- **04_AI_Integration.md** - LLM provider and prompts
- **05_User_Flow_UX.md** - Complete user journey
- **12_Implementation_Checklist.md** - Day-by-day tasks

## 🔧 Configuration

### Environment Variables

Create `.env.local` file (not committed to git):

```bash
# LLM API (choose one)
GEMINI_API_KEY=your_gemini_api_key
# OR
OPENAI_API_KEY=your_openai_api_key

# Rate limiting
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MINUTES=60
```

## 🧪 Testing

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📝 Key Features (MVP)

### Must-Have Features
- ✅ PDF upload (drag & drop)
- ⏳ AI quiz generation (10-20 questions)
- ⏳ Multiple choice questions with explanations
- ⏳ Instant feedback on answers
- ⏳ Quiz history and scores
- ⏳ Offline quiz-taking

### Nice-to-Have (Phase 2)
- Quiz organization (courses, topics)
- Export quiz to PDF
- Dark mode
- Social sharing
- Analytics dashboard

## 🏗️ Tech Stack

- **Frontend**: React 19, Next.js 16, TypeScript, TailwindCSS
- **Database**: SQL.js (client-side SQLite)
- **Backend**: Vercel Serverless Functions
- **AI**: Google Gemini Flash or OpenAI GPT-4o-mini
- **Hosting**: Vercel (free tier)

## 📄 License

Private project - All rights reserved.

## 🤝 Contributing

This is currently a private MVP project. Contributions will be opened after validation phase.

## 📞 Support

For questions or issues, create an issue in the GitHub repository.

---

**Status**: 🚧 Under Active Development

**Current Phase**: Week 3-4 (Core Features) ✅ → Week 5-6 (Polish & PWA) ⏳

**Next Milestone**: Build quiz display interface and answer validation

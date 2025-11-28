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
- [x] PDF text extraction (pdfjs-dist)
- [x] LLM API integration (Gemini 2.5 Flash)
- [x] Quiz generation endpoint
- [x] Quiz display interface
- [x] Answer checking logic
- [x] Results screen with scoring

### Week 5-6: Organization & Configuration ✅
- [x] Quiz configuration modal
- [x] Session presets (Learn/Test/Fast Learn/Custom)
- [x] Quiz browser with filtering
- [x] Quiz history view
- [x] Organizational metadata (institution, program, course, topic)
- [x] Edit quiz functionality

### Week 7-8: Polish & PWA (Current)
- [x] Testing and bug fixes
- [x] Performance optimization
- [ ] PWA manifest and service worker
- [ ] Offline support
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

### Must-Have Features ✅
- ✅ PDF upload (drag & drop)
- ✅ AI quiz generation (15 questions per PDF)
- ✅ Multiple choice questions with explanations
- ✅ Instant feedback on answers
- ✅ Quiz history and session tracking
- ✅ Quiz browser with tag-based filtering
- ✅ Session configuration (Learn/Test/Fast Learn modes)
- ✅ Organizational metadata (institution, program, course, topic)
- ✅ Edit quiz metadata
- ✅ Hint system
- ✅ Citation tracking

### Nice-to-Have (Phase 2)
- PWA offline support (service worker)
- Export quiz to PDF
- Dark mode
- Question/option randomization
- Per-question timer
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

**Status**: 🚀 MVP Complete - Ready for Beta Testing

**Current Phase**: Week 7-8 (Polish & PWA)

**MVP Completion**: ~90% (Core features complete, PWA optimization remaining)

**Next Milestone**: Add PWA features (service worker, offline support) and beta user testing

# KwizMe - AI Quiz Generator

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
├── lib/                   # Utilities and libraries
│   ├── db/               # Database utilities
│   ├── supabase/         # Supabase integration
│   └── hooks/            # Custom React hooks
├── archive/               # Archived documentation
│   └── planning/         # Planning and validation docs
└── supabase/             # Supabase migrations and config
```

## 🗄️ Database Architecture

KwizMe uses **Supabase** (PostgreSQL) for cloud data storage:

- **Cloud-based** - Data syncs across all your devices
- **Real-time sync** - Changes appear instantly on all devices
- **Secure** - Row-level security ensures data privacy
- **User authentication** - Secure login with email/password

### Schema

See `/supabase_complete_schema.sql` for complete database schema including:
- `quizzes` - Generated quiz metadata with user ownership
- `questions` - Quiz questions with text-based answers
- `review_sessions` - Quiz attempt history with configuration
- `answer_records` - Individual answer tracking

## 🎯 Current Status

**Phase:** UX Improvements (December 2024)
**MVP Completion:** ~95%
**Status:** Production Ready ✅

### What's Working ✅
- ✅ PDF upload and text extraction
- ✅ AI quiz generation (Gemini 2.5 Flash)
- ✅ Quiz taking with instant feedback
- ✅ Session configuration (Learn/Test/Fast Learn modes)
- ✅ Quiz browser with filtering
- ✅ Quiz history and review
- ✅ User authentication (Supabase Auth)
- ✅ Cloud storage with real-time sync
- ✅ Cross-device synchronization
- ✅ Mobile responsive design
- ✅ Question editing and management
- ✅ **PWA Support** - Install as app, offline access, native experience

### What's Next 🚧
See **[IMMEDIATE_ACTION_PLAN.md](./IMMEDIATE_ACTION_PLAN.md)** for current priorities:
1. Question/Option Randomization
2. Review Mistakes Mode
3. Better Loading States
4. Keyboard Shortcuts
5. Dark Mode

## 📖 Documentation

### Current Documentation
- **[IMMEDIATE_ACTION_PLAN.md](./IMMEDIATE_ACTION_PLAN.md)** - Current tasks and implementation plan
- **[README.md](./README.md)** - This file (project overview)
- **[PWA_QUICKSTART.md](./PWA_QUICKSTART.md)** - ⚡ Quick guide to PWA setup (5 minutes)
- **[PWA_SETUP.md](./PWA_SETUP.md)** - Detailed PWA implementation guide
- **[PWA_TESTING_CHECKLIST.md](./PWA_TESTING_CHECKLIST.md)** - Complete PWA testing checklist

### Archived Documentation
All planning and validation documents are in `/archive/planning/`:
- **Development guides** - Setup, testing, and quick reference
- **Pre-validation planning** - MVP planning and technical architecture
- **Phase summaries** - Completion reports for each phase
- **Feature roadmap** - Long-term feature planning

See **[archive/planning/README.md](./archive/planning/README.md)** for full index.

## 🔧 Configuration

### Environment Variables

Create `.env.local` file (not committed to git):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Integration
GEMINI_API_KEY=your_gemini_api_key

# Optional: Rate limiting
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

## 📝 Key Features

### Core Features ✅
- ✅ PDF upload (drag & drop)
- ✅ AI quiz generation (15 questions per PDF)
- ✅ Multiple choice questions with explanations
- ✅ Instant feedback on answers
- ✅ Quiz history and session tracking
- ✅ Quiz browser with tag-based filtering
- ✅ Session configuration (Learn/Test/Fast Learn modes)
- ✅ Organizational metadata (institution, program, course, topic)
- ✅ Question editing and management
- ✅ Hint system
- ✅ Citation tracking
- ✅ User authentication
- ✅ Cloud storage
- ✅ Real-time cross-device sync
- ✅ **PWA Support**
  - ✅ Installable on mobile and desktop
  - ✅ Offline access to cached content
  - ✅ Native app-like experience
  - ✅ App shortcuts for quick actions
  - ✅ Custom splash screen and icons

### In Progress 🚧
- Question/option randomization
- Review mistakes mode
- Better loading states
- Keyboard shortcuts
- Dark mode

### Future Features
- Export quiz to PDF
- Spaced repetition system
- Analytics dashboard
- Collaborative features
- Push notifications for study reminders

## 🏗️ Tech Stack

- **Frontend**: React 19, Next.js 15, TypeScript, TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Backend**: Vercel Serverless Functions
- **AI**: Google Gemini 2.5 Flash
- **Hosting**: Vercel
- **PDF Processing**: pdfjs-dist (browser-based)

## 🚀 Deployment

The app is deployed on Vercel with automatic deployments from the main branch.

**Production URL**: [Your Vercel URL]

### Manual Deploy
```bash
# Deploy to production
vercel --prod

# Set environment variables in Vercel dashboard
```

## 📄 License

Private project - All rights reserved.

## 🤝 Contributing

This is currently a private project. Contributions may be opened in the future.

## 📞 Support

For questions or issues, create an issue in the GitHub repository.

---

**Status**: 🚀 Production Ready - Active Development

**Current Focus**: UX Improvements (see [IMMEDIATE_ACTION_PLAN.md](./IMMEDIATE_ACTION_PLAN.md))

**Next Milestone**: Complete UX improvements, then beta user feedback collection

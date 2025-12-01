# QuizMe PWA Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER DEVICE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    QuizMe App (Installed)                   │    │
│  │                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │   Generate   │  │    Browse    │  │   History    │    │    │
│  │  │     Quiz     │  │   Quizzes    │  │              │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │    │
│  │                                                              │    │
│  │                    React Components                         │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                   │                                  │
│                                   ↓                                  │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                 Service Worker (sw.js)                      │    │
│  │                                                              │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │    │
│  │  │  Fetch Events │  │  Cache Manager│  │  Background   │  │    │
│  │  │               │  │               │  │  Sync         │  │    │
│  │  └───────────────┘  └───────────────┘  └───────────────┘  │    │
│  │                                                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓           ↓                               │
│                          │           │                               │
│         ┌────────────────┘           └────────────────┐             │
│         ↓                                              ↓             │
│  ┌─────────────┐                            ┌─────────────────┐    │
│  │   Network   │                            │   Cache Storage │    │
│  │  (Online)   │                            │   (Offline)     │    │
│  └─────────────┘                            └─────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ↓
                   ┌───────────────────────────┐
                   │    Internet Required       │
                   │                            │
                   │  ┌──────────────────────┐ │
                   │  │  Next.js API Routes  │ │
                   │  │  /api/generate-quiz  │ │
                   │  └──────────────────────┘ │
                   │           ↓                │
                   │  ┌──────────────────────┐ │
                   │  │  Supabase Backend    │ │
                   │  │  - Auth              │ │
                   │  │  - Database          │ │
                   │  │  - Storage           │ │
                   │  └──────────────────────┘ │
                   │           ↓                │
                   │  ┌──────────────────────┐ │
                   │  │  External Services   │ │
                   │  │  - Google Gemini AI  │ │
                   │  └──────────────────────┘ │
                   └───────────────────────────┘

═══════════════════════════════════════════════════════════════════════

PWA CACHING STRATEGY

┌─────────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW                                 │
└─────────────────────────────────────────────────────────────────────┘

User Request
     │
     ↓
Service Worker Intercepts
     │
     ↓
┌────┴────┐
│  Check  │
│  Type   │
└────┬────┘
     │
     ├─── API Request (/api/*) ─────→ ALWAYS Network
     │                                 (Show error if offline)
     │
     ├─── Navigation Request ────────→ Network First
     │                                 ↓
     │                           Try Network
     │                                 │
     │                           ┌─────┴──────┐
     │                           │  Success?  │
     │                           └─────┬──────┘
     │                                 │
     │                      ┌──────────┼──────────┐
     │                      │          │          │
     │                     Yes        No       Timeout
     │                      │          │          │
     │                 Return & ────→ Check ←────┘
     │                  Cache    Cache
     │                                 │
     │                         ┌───────┴────────┐
     │                         │   Has Cache?   │
     │                         └───────┬────────┘
     │                                 │
     │                        ┌────────┼────────┐
     │                        │                 │
     │                      Yes               No
     │                        │                 │
     │                  Return Cache    Show /offline
     │
     └─── Static Asset ──────────────→ Cache First
                                       ↓
                                 Check Cache
                                       │
                               ┌───────┴────────┐
                               │   Has Cache?   │
                               └───────┬────────┘
                                       │
                              ┌────────┼────────┐
                              │                 │
                            Yes               No
                              │                 │
                        Return Cache    Fetch Network
                                             │
                                        Cache & Return

═══════════════════════════════════════════════════════════════════════

INSTALLATION FLOW

┌─────────────────────────────────────────────────────────────────────┐
│                     DESKTOP (Chrome/Edge)                            │
└─────────────────────────────────────────────────────────────────────┘

1. User visits QuizMe
       │
       ↓
2. Browser checks PWA criteria
   ✓ HTTPS
   ✓ manifest.json exists
   ✓ Service worker registered
   ✓ Valid icons
       │
       ↓
3. Install icon appears in address bar
       │
       ↓
4. User clicks install
       │
       ↓
5. Confirmation dialog shows
       │
       ↓
6. User confirms
       │
       ↓
7. App installed
   - Desktop icon/shortcut created
   - Opens in standalone window
   - No browser UI
       │
       ↓
8. Service worker caches assets
       │
       ↓
9. App ready for offline use


┌─────────────────────────────────────────────────────────────────────┐
│                     MOBILE (iOS Safari)                              │
└─────────────────────────────────────────────────────────────────────┘

1. User visits QuizMe in Safari
       │
       ↓
2. User taps Share button ⎙
       │
       ↓
3. Scrolls to "Add to Home Screen"
       │
       ↓
4. Taps "Add to Home Screen"
       │
       ↓
5. Reviews app name and icon
       │
       ↓
6. Taps "Add"
       │
       ↓
7. Icon appears on home screen
       │
       ↓
8. Tap icon to launch
   - Opens in fullscreen
   - Status bar matches theme
   - No Safari UI


┌─────────────────────────────────────────────────────────────────────┐
│                   MOBILE (Android Chrome)                            │
└─────────────────────────────────────────────────────────────────────┘

1. User visits QuizMe
       │
       ↓
2. Install banner appears
   "Add QuizMe to Home screen"
       │
       ↓
3. User taps "Install"
   (or Menu → "Install app")
       │
       ↓
4. Confirmation dialog
       │
       ↓
5. User confirms
       │
       ↓
6. App installs to device
   - Icon in app drawer
   - Appears in app list
       │
       ↓
7. Long-press shows shortcuts
   - Generate Quiz
   - Browse Quizzes
   - Quiz History

═══════════════════════════════════════════════════════════════════════

FILE STRUCTURE

quizme/
├── public/
│   ├── manifest.json              ← PWA manifest
│   ├── sw.js                      ← Service worker
│   ├── generate-icons.html        ← Icon generator
│   ├── icon-192x192.png          ← App icon (small)
│   └── icon-512x512.png          ← App icon (large)
│
├── app/
│   ├── layout.tsx                ← PWA meta tags
│   ├── page.tsx                  ← Main app
│   └── offline/
│       └── page.tsx              ← Offline fallback
│
├── components/
│   └── PWAInstaller.tsx          ← Service worker registration
│
└── Documentation/
    ├── PWA_QUICKSTART.md         ← 5-min setup guide
    ├── PWA_SETUP.md              ← Detailed guide
    ├── PWA_TESTING_CHECKLIST.md  ← Testing checklist
    ├── PWA_COMPLETE.md           ← Implementation summary
    └── PWA_ARCHITECTURE.md       ← This file

═══════════════════════════════════════════════════════════════════════

OFFLINE CAPABILITIES

┌─────────────────────────────────────────────────────────────────────┐
│                        WORKS OFFLINE ✅                              │
├─────────────────────────────────────────────────────────────────────┤
│ • Home page                                                          │
│ • Previously visited pages                                           │
│ • Cached quizzes (already loaded)                                    │
│ • Quiz history (already loaded)                                      │
│ • Quiz browser (cached list)                                         │
│ • Taking cached quizzes                                              │
│ • Reviewing past attempts                                            │
│ • Offline fallback page                                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    REQUIRES INTERNET ❌                              │
├─────────────────────────────────────────────────────────────────────┤
│ • Generating new quizzes (AI API)                                    │
│ • Uploading files (server processing)                                │
│ • User authentication (Supabase)                                     │
│ • Syncing data (Supabase)                                            │
│ • Loading new quizzes                                                │
│ • Fetching latest history                                            │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════

CACHE LIFECYCLE

┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE WORKER LIFECYCLE                        │
└─────────────────────────────────────────────────────────────────────┘

Install Event
     │
     ↓
Cache Critical Assets
- /
- /offline
- /manifest.json
- /icon-192x192.png
- /icon-512x512.png
     │
     ↓
Skip Waiting (activate immediately)


Activate Event
     │
     ↓
Clean Old Caches
- Delete caches not in current version
     │
     ↓
Take Control (claim clients)


Fetch Event (ongoing)
     │
     ↓
Intercept All Requests
     │
     ↓
Apply Caching Strategy
     │
     ↓
Return Response


Update Event (every 60 seconds)
     │
     ↓
Check for New Service Worker
     │
     ↓
If New Version → Install
     │
     ↓
Wait for User to Close All Tabs
     │
     ↓
Activate New Version

═══════════════════════════════════════════════════════════════════════

FUTURE ENHANCEMENTS

Phase 1: Enhanced Offline
┌────────────────────────────────────┐
│ • IndexedDB for quiz storage       │
│ • Offline quiz generation queue    │
│ • Smart cache size management      │
│ • Precache user's favorite quizzes │
└────────────────────────────────────┘

Phase 2: Background Sync
┌────────────────────────────────────┐
│ • Sync quiz submissions when online│
│ • Background data refresh          │
│ • Conflict resolution              │
│ • Progress indicators              │
└────────────────────────────────────┘

Phase 3: Push Notifications
┌────────────────────────────────────┐
│ • Study reminders                  │
│ • New quiz notifications           │
│ • Weekly progress reports          │
│ • Achievement alerts               │
└────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════

Built with: Next.js, React, TypeScript, Service Workers, Web App Manifest
Status: ✅ Production Ready
Last Updated: December 2024

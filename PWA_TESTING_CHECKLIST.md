# PWA Testing Checklist

## Before Testing
- [ ] Generate app icons using `/public/generate-icons.html`
- [ ] Save icons as `icon-192x192.png` and `icon-512x512.png` in `/public/`
- [ ] Deploy to production (Vercel) or test on localhost with HTTPS

## Desktop Testing (Chrome/Edge)

### Installation
- [ ] Open app in Chrome/Edge
- [ ] See install icon in address bar
- [ ] Click install button
- [ ] App installs as standalone window
- [ ] App icon appears in Applications/Programs

### Service Worker
- [ ] Open DevTools → Application → Service Workers
- [ ] Verify service worker is registered and active
- [ ] Check "Offline" box
- [ ] Navigate to different pages
- [ ] Previously visited pages load from cache
- [ ] Uncheck "Offline" - pages update

### Manifest
- [ ] Open DevTools → Application → Manifest
- [ ] Verify manifest loads without errors
- [ ] Check app name, colors, icons display correctly

### Offline Functionality
- [ ] Open installed app
- [ ] Open DevTools → Network → Offline
- [ ] Try to navigate - offline page appears
- [ ] Uncheck offline - auto-redirects to home

## Mobile Testing (iOS)

### Safari Installation
- [ ] Open app in Safari
- [ ] Tap Share button (bottom center)
- [ ] Scroll and tap "Add to Home Screen"
- [ ] Customize name if desired
- [ ] Tap "Add"
- [ ] Icon appears on home screen

### App Experience
- [ ] Launch app from home screen
- [ ] App opens in fullscreen (no Safari UI)
- [ ] Status bar matches theme color
- [ ] Navigation works smoothly
- [ ] Can switch between apps normally

### Offline Test
- [ ] Enable Airplane mode
- [ ] Open installed app
- [ ] Try to generate quiz - offline message shows
- [ ] Browse cached quizzes - still accessible
- [ ] Disable Airplane mode - app reconnects

## Mobile Testing (Android)

### Chrome Installation
- [ ] Open app in Chrome
- [ ] Banner appears: "Add QuizMe to Home screen"
- [ ] Or tap menu → "Install app"
- [ ] Confirm installation
- [ ] Icon appears in app drawer

### App Experience
- [ ] Launch app from app drawer
- [ ] App opens as standalone app
- [ ] Theme color appears in status bar
- [ ] Back button works correctly
- [ ] Can minimize and restore app

### App Shortcuts (Long-press icon)
- [ ] Long-press app icon
- [ ] See shortcuts: Generate, Browse, History
- [ ] Tap "Generate Quiz" - opens to generation page
- [ ] Tap "Browse Quizzes" - opens to quiz browser
- [ ] Tap "Quiz History" - opens to history page

### Offline Test
- [ ] Enable Airplane mode
- [ ] Open installed app
- [ ] Navigate to cached pages - works
- [ ] Try new quiz generation - offline page shows
- [ ] Disable Airplane mode - app reconnects

## Functionality Testing

### Core Features (Online)
- [ ] Generate new quiz from file upload
- [ ] Take quiz and submit answers
- [ ] View quiz results
- [ ] Browse saved quizzes
- [ ] View quiz history
- [ ] Edit questions (if applicable)
- [ ] Delete quizzes

### Core Features (Offline)
- [ ] Access home page
- [ ] Browse previously loaded quizzes
- [ ] View quiz history (cached)
- [ ] Cannot generate new quizzes (expected)
- [ ] Cannot upload files (expected)
- [ ] See clear offline messaging

### Theme Support
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] Theme persists across sessions
- [ ] Theme color updates status bar (mobile)

### Performance
- [ ] Initial load time < 3 seconds
- [ ] Navigation feels instant (cached)
- [ ] No console errors
- [ ] Service worker updates periodically

## Advanced Testing

### Cache Management
- [ ] Open DevTools → Application → Cache Storage
- [ ] See `quizme-v1` cache
- [ ] See `quizme-runtime-v1` cache
- [ ] Verify cached resources present
- [ ] Clear cache - resources re-cache on visit

### Service Worker Updates
- [ ] Make change to service worker version
- [ ] Deploy new version
- [ ] Open app - new SW installs
- [ ] Close all tabs - new SW activates
- [ ] Reopen app - new version active

### Uninstallation
- [ ] Desktop: Right-click icon → Uninstall
- [ ] iOS: Long-press icon → Remove App
- [ ] Android: Drag to uninstall or Settings → Apps
- [ ] Verify app fully removed

## Common Issues

### Install Button Not Showing
- Check HTTPS is enabled (required)
- Verify manifest.json loads (no 404)
- Check service worker registers
- Ensure icons exist and load

### Icons Not Appearing
- Generate icons from `/public/generate-icons.html`
- Save to correct location (`/public/`)
- Verify manifest.json references correct paths
- Clear browser cache and reinstall

### Service Worker Errors
- Check browser console for errors
- Verify sw.js syntax is correct
- Ensure proper CORS headers
- Try unregister and re-register

### Offline Page Not Showing
- Verify `/offline` route exists
- Check service worker caches `/offline`
- Test offline mode in DevTools
- Clear cache and try again

## Sign-off

Tested by: _________________
Date: _________________
Browser/Device: _________________
PWA Version: _________________

Notes:
____________________________________________
____________________________________________
____________________________________________

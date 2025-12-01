# PWA Setup for QuizMe

## Overview
QuizMe is now configured as a Progressive Web App (PWA), enabling:
- ✅ Installation on mobile and desktop devices
- ✅ Offline access to cached content
- ✅ Native app-like experience
- ✅ Background sync for quiz sessions
- ✅ Push notifications (optional)

## Files Created

### 1. `/public/manifest.json`
The app manifest that defines PWA metadata:
- App name, description, and branding
- Theme colors (blue for light mode, darker blue for dark mode)
- App icons (192x192 and 512x512)
- Shortcuts to key features
- Display mode (standalone)

### 2. `/public/sw.js`
Service worker that handles:
- Offline functionality with caching strategies
- Network-first for navigation
- Cache-first for static assets
- Background sync for quiz sessions
- Push notification support

### 3. `/app/offline/page.tsx`
Fallback page shown when user is offline:
- Shows offline status
- Lists what users can still do
- Auto-redirects when connection restored

### 4. `/components/PWAInstaller.tsx`
Client component that:
- Registers the service worker
- Handles PWA install prompts
- Monitors online/offline status
- Checks for service worker updates

### 5. `/app/layout.tsx` (Updated)
Added PWA meta tags:
- Manifest link
- Theme colors for light/dark mode
- Viewport configuration
- Apple web app meta tags
- App icons

## Icon Setup

### Generate Placeholder Icons
1. Open `/public/generate-icons.html` in a browser
2. Download the generated icons:
   - `icon-192x192.png`
   - `icon-512x512.png`
3. Save them to `/public/` directory

### Create Custom Icons (Recommended)
Replace the placeholder icons with branded versions:
- Use a design tool (Figma, Canva, etc.)
- Create icons at 192x192 and 512x512 pixels
- Use the QuizMe brand colors (blue gradient)
- Include the "Q" logo or full "QuizMe" text
- Export as PNG with transparent or solid background

### Additional Icon Sizes (Optional)
For better compatibility, consider adding:
- `icon-72x72.png` - Android devices
- `icon-96x96.png` - Android devices
- `icon-128x128.png` - Android devices
- `icon-144x144.png` - Windows tiles
- `icon-152x152.png` - iOS devices
- `icon-384x384.png` - Android splash

## Testing PWA Installation

### Desktop (Chrome/Edge)
1. Run `npm run dev` or deploy to production
2. Open the app in Chrome/Edge
3. Look for install icon in address bar
4. Click "Install QuizMe"
5. App opens in standalone window

### Mobile (iOS Safari)
1. Open the app in Safari
2. Tap the "Share" button
3. Scroll and tap "Add to Home Screen"
4. Tap "Add" to install
5. App icon appears on home screen

### Mobile (Android Chrome)
1. Open the app in Chrome
2. Tap the three-dot menu
3. Tap "Install app" or "Add to Home Screen"
4. Tap "Install"
5. App appears in app drawer

## Testing Offline Functionality

1. Open the PWA (installed or in browser)
2. Open DevTools → Network tab
3. Select "Offline" in throttling dropdown
4. Navigate through the app:
   - Previously visited pages should load from cache
   - New quiz generation will show offline page
   - Cached quizzes remain accessible

## Service Worker Caching Strategy

### Precached Assets (Immediate)
- Home page (`/`)
- Offline fallback page (`/offline`)
- App manifest and icons

### Runtime Cache (On-demand)
- Navigation pages (network-first, cache fallback)
- Static assets: CSS, JS, images (cache-first)
- API routes: Always use network (show error if offline)

### Cache Updates
- Service worker checks for updates every 60 seconds
- Users get new version after closing all tabs
- Or manually clear cache in DevTools

## Shortcuts Configuration

The PWA includes 3 app shortcuts:
1. **Generate Quiz** - Direct to quiz generation
2. **Browse Quizzes** - View all saved quizzes
3. **Quiz History** - Review past attempts

Users can access these by:
- Right-clicking app icon (desktop)
- Long-pressing app icon (Android)
- Force-touching app icon (iOS - limited support)

## Push Notifications (Optional)

The service worker includes push notification support. To enable:

1. Request notification permission:
```javascript
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      // User allowed notifications
    }
  });
}
```

2. Send push from server:
```javascript
// Use Web Push protocol with VAPID keys
// Implementation depends on your backend
```

3. Use cases:
   - Remind users to practice
   - Notify of new quiz content
   - Quiz completion reminders

## Background Sync (Future)

The service worker includes background sync for:
- Syncing quiz sessions when back online
- Uploading quiz results that failed
- Updating cached quiz data

To enable, implement in `/public/sw.js`:
```javascript
async function syncQuizSessions() {
  // Get pending sessions from IndexedDB
  // POST to API when online
  // Update local cache
}
```

## Troubleshooting

### PWA Not Installing
- Ensure HTTPS (required, except localhost)
- Check manifest.json is valid (use Chrome DevTools → Application → Manifest)
- Verify service worker registered (DevTools → Application → Service Workers)
- Check console for errors

### Service Worker Not Updating
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Clear site data (DevTools → Application → Clear storage)
- Unregister old worker (DevTools → Application → Service Workers → Unregister)

### Offline Page Not Showing
- Ensure `/offline` route exists
- Check service worker cache includes `/offline`
- Verify fetch event handler fallback works

### Icons Not Appearing
- Check icon files exist in `/public/`
- Verify manifest.json icon paths are correct
- Clear browser cache and reinstall PWA

## Production Deployment

### Vercel (Recommended)
```bash
# Push to GitHub
git add .
git commit -m "Add PWA support"
git push

# Vercel auto-deploys (HTTPS enabled by default)
```

### Environment Variables
No additional env vars needed for PWA. Existing setup works.

### HTTPS Required
PWAs require HTTPS in production. Vercel provides this automatically.

### Testing Production PWA
1. Deploy to Vercel
2. Open production URL on mobile device
3. Test installation from home screen
4. Test offline functionality
5. Verify service worker caching

## Future Enhancements

1. **Advanced Caching**
   - Cache quiz PDFs for offline access
   - Store quiz images locally
   - Implement smart cache size limits

2. **Background Sync**
   - Queue quiz submissions when offline
   - Sync when connection restored
   - Show sync status to users

3. **Push Notifications**
   - Study reminders
   - New quiz alerts
   - Weekly progress reports

4. **App Shortcuts**
   - Quick actions from home screen
   - Recent quizzes shortcut
   - Favorite topics shortcut

5. **Install Prompt**
   - Custom install banner
   - Show after user engagement
   - Explain PWA benefits

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Next.js PWA](https://github.com/shadowwalker/next-pwa)

## Support

For issues with PWA functionality:
1. Check browser console for errors
2. Verify service worker status in DevTools
3. Test in incognito mode (fresh state)
4. Try different browsers/devices

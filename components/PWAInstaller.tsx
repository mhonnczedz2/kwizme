'use client';

import { useEffect } from 'react';

export default function PWAInstaller() {
  useEffect(() => {
    let updateInterval: NodeJS.Timeout | null = null;

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Check for updates periodically
          updateInterval = setInterval(() => {
            // Verify registration is still valid before updating
            if (registration) {
              registration.update().catch((error) => {
                console.error('⚠️ Service Worker update failed:', error);
              });
            }
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    // Handle PWA install prompt
    let deferredPrompt: any;

    const handleBeforeInstall = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;

      console.log('💡 PWA install prompt available');

      // You could show a custom install button here
      // For now, we'll just let the browser handle it
    };

    const handleAppInstalled = () => {
      console.log('🎉 PWA was installed');
      deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Handle online/offline status
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      console.log(isOnline ? '🟢 Online' : '🔴 Offline');

      // You could show a toast notification here
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Cleanup function
    return () => {
      // Clear the update interval
      if (updateInterval) {
        clearInterval(updateInterval);
      }

      // Remove event listeners
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return null; // This component doesn't render anything
}

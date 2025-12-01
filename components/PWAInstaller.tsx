'use client';

import { useEffect } from 'react';

export default function PWAInstaller() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    // Handle PWA install prompt
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;

      console.log('💡 PWA install prompt available');

      // You could show a custom install button here
      // For now, we'll just let the browser handle it
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA was installed');
      deferredPrompt = null;
    });

    // Handle online/offline status
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      console.log(isOnline ? '🟢 Online' : '🔴 Offline');

      // You could show a toast notification here
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return null; // This component doesn't render anything
}

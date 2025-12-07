import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  environment: process.env.NODE_ENV,

  // Only capture errors in production to avoid development noise
  enabled: process.env.NODE_ENV === 'production',

  // Debug mode for development (set to true if you want to see Sentry logs)
  debug: false,

  // Integration configurations
  integrations: [
    Sentry.replayIntegration({
      // Capture text content for better debugging
      maskAllText: false,
      // Capture all inputs for better debugging (be careful with PII)
      blockAllMedia: false,
    }),
  ],
});
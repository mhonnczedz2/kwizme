import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://c679b2e5b1f0733ab079eafdfdad66ef@o4510488656936960.ingest.us.sentry.io/4510488663556096',

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  environment: process.env.NODE_ENV,

  // Only capture errors in production to avoid development noise
  enabled: process.env.NODE_ENV === 'production',

  // Debug mode for development
  debug: false,
});
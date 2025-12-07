const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['sql.js'],

  // Turbopack configuration (required for Next.js 16)
  turbopack: {
    resolveAlias: {
      // Only polyfill fs in client bundles (sql.js tries to use it)
      fs: {
        browser: './lib/empty.js',
      },
      path: {
        browser: './lib/empty.js',
      },
      crypto: {
        browser: './lib/empty.js',
      },
    },
  },

  // Webpack configuration for production builds (fallback)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: require.resolve('./lib/empty.js'),
        crypto: false,
      };
    }
    return config;
  },
};

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG || "quizme-app",
  project: process.env.SENTRY_PROJECT || "quizme-app",

  // Only run the Sentry webpack plugin in production builds
  silent: process.env.NODE_ENV !== 'production',

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  automaticVercelMonitors: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);

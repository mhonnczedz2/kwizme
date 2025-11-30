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

module.exports = nextConfig;

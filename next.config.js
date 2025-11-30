/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['sql.js'],

  // Webpack configuration for production builds
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

  // Turbopack configuration for development
  turbopack: {
    resolveAlias: {
      fs: './lib/empty.js',
      path: './lib/empty.js',
      crypto: './lib/empty.js',
    },
  },
};

module.exports = nextConfig;

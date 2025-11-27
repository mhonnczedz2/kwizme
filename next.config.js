/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config to acknowledge we're using Turbopack
  // SQL.js should work fine with Turbopack without special configuration
  turbopack: {},

  // Keep webpack config for when explicitly using --webpack flag
  webpack: (config, { isServer }) => {
    // SQL.js needs to load wasm files
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'sql.js': 'sql.js/dist/sql-wasm.js',
      };
    }

    return config;
  },
};

module.exports = nextConfig;

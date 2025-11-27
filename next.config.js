/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
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

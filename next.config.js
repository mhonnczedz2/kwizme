/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['sql.js'],

  // Turbopack configuration to handle Node.js modules in browser
  turbopack: {
    resolveAlias: {
      fs: './lib/empty.js',
      path: './lib/empty.js',
      crypto: './lib/empty.js',
    },
  },
};

module.exports = nextConfig;

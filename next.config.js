/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  webpack: (config, { isServer }) => {
    // 處理 Marp Core 的 ES 模組
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // 處理 @marp-team 套件的 ES 模組
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/@marp-team/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  // 確保靜態資源正確處理
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // 支援 ESM 模組
  transpilePackages: ['@marp-team/marp-core', '@marp-team/marpit'],
};

module.exports = nextConfig;

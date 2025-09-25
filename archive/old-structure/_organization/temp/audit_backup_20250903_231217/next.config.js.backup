/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {},
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },

  env: {
    ADMIN_API_URL: process.env.ADMIN_API_URL || 'http://localhost:8085',
    ML_API_URL: process.env.ML_API_URL || 'http://localhost:8000',
    PYGEOAPI_URL: process.env.PYGEOAPI_URL || 'http://localhost:5080',
    STAC_API_URL: process.env.STAC_API_URL || 'http://localhost:8081',
    MINIO_URL: process.env.MINIO_URL || 'http://localhost:9000',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  async rewrites() {
    return [
      {
        source: '/api/admin/:path*',
        destination: `${process.env.ADMIN_API_URL || 'http://localhost:8085'}/:path*`,
      },
      {
        source: '/api/ml/:path*',
        destination: `${process.env.ML_API_URL || 'http://localhost:8000'}/:path*`,
      },
      {
        source: '/api/geo/:path*',
        destination: `${process.env.PYGEOAPI_URL || 'http://localhost:5080'}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configurações específicas para análise de bundle
    if (process.env.ANALYZE) {
      const withBundleAnalyzer = require('@next/bundle-analyzer')({
        enabled: process.env.ANALYZE === 'true',
      });
      return withBundleAnalyzer(config);
    }
    return config;
  },
};

module.exports = nextConfig;

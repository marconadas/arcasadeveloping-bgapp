/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  assetPrefix: '',
  basePath: '',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Fix para Canvas no TensorFlow.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        worker_threads: false,
        child_process: false,
      };
    }

    // Ignorar warnings do TensorFlow.js
    config.ignoreWarnings = [
      { module: /node_modules\/tensorflow/ },
      { file: /node_modules\/tensorflow/ }
    ];

    return config;
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://bgapp-frontend.pages.dev',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://bgapp-api.maredata.workers.dev/ws'
  }
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use export mode for builds, not dev
  ...(process.env.NODE_ENV === 'production' || process.env.NEXT_BUILD === 'true' ? {
    output: 'export',
    distDir: 'out',
  } : {}),
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true // Ignorar ESLint durante build para deployment
  },
  images: {
    unoptimized: true
  },
  assetPrefix: '',
  basePath: '',
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

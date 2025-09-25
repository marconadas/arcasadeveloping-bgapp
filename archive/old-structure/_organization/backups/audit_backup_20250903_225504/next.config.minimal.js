/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Desativar para reduzir overhead
  swcMinify: false, // Desativar minificação para economizar recursos
  experimental: {
    turbo: false, // Desativar Turbopack se disponível
  },
  images: {
    unoptimized: true,
  },
  // Configurações para reduzir uso de memória
  compress: false, // Desativar compressão gzip
  poweredByHeader: false,
  generateEtags: false,
  
  // Headers otimizados para cache agressivo
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  
  webpack: (config, { dev }) => {
    if (dev) {
      // Configurações para desenvolvimento com baixo uso de recursos
      config.cache = false;
      config.optimization.minimize = false;
      config.optimization.splitChunks = {
        chunks: 'async',
        minSize: 20000,
        maxSize: 244000,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

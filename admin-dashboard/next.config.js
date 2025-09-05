/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript errors must be fixed - security requirement
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig

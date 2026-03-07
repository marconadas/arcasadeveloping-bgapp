import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/arcasadeveloping-bgapp',
  images: {
    unoptimized: true
  },
  transpilePackages: [
    "deck.gl",
    "@deck.gl/core",
    "@deck.gl/layers",
    "@deck.gl/geo-layers",
    "@deck.gl/mesh-layers",
    "@deck.gl/extensions",
    "@deck.gl/react",
    "react-leaflet",
    "leaflet",
    "lucide-react",
    "react-leaflet-cluster"
  ],
  experimental: {
    // Potential fixes for monorepo resolution if needed
  }
};

export default nextConfig;

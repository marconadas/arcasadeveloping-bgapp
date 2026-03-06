import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  images: {
    unoptimized: true
  },
  experimental: {
    // Potential fixes for monorepo resolution if needed
  }
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set the project root to avoid lockfile detection issues
  outputFileTracingRoot: path.join(__dirname),
  // Enable experimental optimizations
  experimental: {
    // Optimize package imports - reduces bundle size significantly
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "recharts",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "react-simple-maps",
    ],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
        pathname: "/private/**",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/uc",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/thumbnail",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/place/photo",
      },
      {
        protocol: "https",
        hostname: "maps.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
      },
    ],
    // Disable image optimization errors for expired external URLs
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    // Optimize image loading
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Suppress external image optimization errors
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Enable React strict mode for better development
  reactStrictMode: true,

  // Power pack - compress responses
  compress: true,
};

export default nextConfig;

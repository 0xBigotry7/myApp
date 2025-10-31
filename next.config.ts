import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
    // Disable image optimization errors for expired external URLs
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },
  // Suppress external image optimization errors
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;

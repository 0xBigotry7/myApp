import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
        pathname: "/private/**",
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

import "./src/env.server";
import type { NextConfig } from "next";

// Defines Next.js configuration
const nextConfig: NextConfig = {
  images: {
    // Allows loading images from Instagram CDN (uses wildcard for dynamic hostnames)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "scontent-*.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  // Configures API route body size limits
  // Note: Next.js App Router handles body parsing differently
  // These limits are enforced via middleware and route handlers
  experimental: {
    // Maximum body size for API routes (in bytes)
    // Default is 1MB, we set it to 500KB for webhooks
    serverActions: {
      bodySizeLimit: "500kb",
    },
  },
};

export default nextConfig;

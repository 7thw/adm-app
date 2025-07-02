import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from your custom domain during development
  allowedDevOrigins: [
    'adm-realigna.7thw.co',
    'localhost:3100',
    '192.168.1.241:3100'
  ],
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
    ],
  },
  experimental: {
    // Enable server actions if needed
    serverActions: {
      allowedOrigins: ['adm-realigna.7thw.co', 'localhost:3100']
    }
  }
};

export default nextConfig;

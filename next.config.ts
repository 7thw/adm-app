import type { NextConfig } from "next";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from your custom domain during development
  allowedDevOrigins: [
    'adm-realigna.7thw.co',
    'localhost:3100',
    '192.168.1.241:3100'
  ],
  experimental: {
    // Enable server actions if needed
    serverActions: {
      allowedOrigins: ['adm-realigna.7thw.co', 'localhost:3100']
    }
  }
};

export default nextConfig;

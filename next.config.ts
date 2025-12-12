import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase body size limit for server actions (100MB)
    serverActions: {
      bodySizeLimit: '100mb'
    }
  },
  // Increase body size limit for API routes
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
    responseLimit: false,
  }
};

export default nextConfig;

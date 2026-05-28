import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disable Next.js's built-in response gzip. SSE responses must not be
  // compressed — gzip buffers small writes and the client sees nothing.
  // Backend responses are tiny JSON, so the bandwidth tradeoff is fine.
  compress: false,
  // Proxy /api/* to the FastAPI backend. Lets a single ngrok / Vercel deploy
  // serve both sides with no CORS to configure.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/:path*` }];
  },
};

export default nextConfig;

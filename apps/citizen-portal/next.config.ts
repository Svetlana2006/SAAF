import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@saaf/platform"],
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;

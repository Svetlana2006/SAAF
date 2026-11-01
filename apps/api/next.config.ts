import type { NextConfig } from "next";

/** Origins that are allowed to make credentialed cross-origin requests to this API. */
const ALLOWED_ORIGINS = [
  process.env.CITIZEN_PORTAL_URL ?? "http://localhost:3001",
  process.env.NGO_PORTAL_URL    ?? "http://localhost:3002",
  process.env.CSR_PORTAL_URL    ?? "http://localhost:3003",
  process.env.ADMIN_PORTAL_URL  ?? "http://localhost:3004",
];

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'none'",
      "script-src 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  transpilePackages: ["@saaf/platform"],

  async headers() {
    return [
      // Security headers on every response
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      // CORS pre-flight for API routes — restrict to known portal origins only
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // Must be set per-request in a real multi-origin setup; this default
            // covers single-origin deployments. For multi-origin CORS override this
            // in a middleware or edge function that echoes the Origin header only
            // when it is in ALLOWED_ORIGINS.
            value: ALLOWED_ORIGINS[0],
          },
          { key: "Access-Control-Allow-Methods",     value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers",     value: "Content-Type, Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Max-Age",           value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;


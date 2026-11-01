/**
 * proxy.ts — API CORS guard
 *
 * Dynamically reflects the Origin header only when it matches a known portal
 * origin, so all four portals can make credentialed requests while arbitrary
 * third-party sites are refused.
 *
 * Static headers in next.config.ts cannot do per-request origin reflection;
 * this proxy handles that gap.
 */
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set([
  process.env.CITIZEN_PORTAL_URL ?? "http://localhost:3001",
  process.env.NGO_PORTAL_URL     ?? "http://localhost:3002",
  process.env.CSR_PORTAL_URL     ?? "http://localhost:3003",
  process.env.ADMIN_PORTAL_URL   ?? "http://localhost:3004",
]);

const CORS_HEADERS = {
  "Access-Control-Allow-Methods":     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":     "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age":           "86400",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.has(origin);

  // Handle CORS pre-flight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowed) response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  }

  const response = NextResponse.next();

  // Only set ACAO for recognised origins; omit entirely for unknown ones so
  // browsers enforce the same-origin restriction.
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};

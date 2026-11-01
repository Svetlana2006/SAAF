import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

type RateLimitBucket = { count: number; reset_at: Date };

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanupAt = 0;

export function getRateLimitClientAddress(
  request: NextRequest,
  headerName = process.env.RATE_LIMIT_CLIENT_IP_HEADER,
): string {
  if (!headerName?.trim()) return "unknown";
  const value = request.headers.get(headerName.trim())?.trim();
  return value && isIP(value) ? value : "unknown";
}

export function createRateLimitBucketKey(
  routeKey: string,
  clientAddress: string,
  secret: string,
): string {
  return createHmac("sha256", secret).update(`${routeKey}:${clientAddress}`).digest("hex");
}

export async function rateLimit(
  request: NextRequest,
  key: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const now = new Date();
  const nowMs = now.getTime();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for shared API rate limiting.");
  }

  if (nowMs - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
    await prisma.$executeRaw`
      DELETE FROM "rate_limit_buckets" WHERE "reset_at" <= ${now}
    `;
    lastCleanupAt = nowMs;
  }

  const clientAddress = getRateLimitClientAddress(request);
  const bucketKey = createRateLimitBucketKey(key, clientAddress, databaseUrl);
  const resetAt = new Date(nowMs + windowMs);
  const [bucket] = await prisma.$queryRaw<RateLimitBucket[]>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "reset_at", "updated_at")
    VALUES (${bucketKey}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_buckets"."reset_at" <= ${now} THEN 1
        ELSE "rate_limit_buckets"."count" + 1
      END,
      "reset_at" = CASE
        WHEN "rate_limit_buckets"."reset_at" <= ${now} THEN ${resetAt}
        ELSE "rate_limit_buckets"."reset_at"
      END,
      "updated_at" = ${now}
    RETURNING "count", "reset_at"
  `;

  if (bucket.count <= limit) return null;

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((bucket.reset_at.getTime() - nowMs) / 1000))),
      },
    },
  );
}

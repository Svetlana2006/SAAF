import { NextRequest, NextResponse } from "next/server";

// Process-local protection for single-instance deployments. Use a shared store
// (for example Redis/Upstash) before running multiple API instances.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: NextRequest, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const bucketKey = `${key}:${ip}`;
  let bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(bucketKey, bucket);
  }
  bucket.count += 1;
  if (buckets.size > 10_000) {
    for (const [candidate, value] of buckets) if (value.resetAt <= now) buckets.delete(candidate);
  }
  if (bucket.count <= limit) return null;
  return NextResponse.json({ error: "Too many requests. Please try again later." }, {
    status: 429,
    headers: { "Retry-After": String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))) },
  });
}

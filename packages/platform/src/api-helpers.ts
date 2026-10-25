/**
 * lib/api-helpers.ts
 * Shared utilities for Next.js API route handlers.
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string; details?: unknown };

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, 201);
}

export function badRequest(message: string, details?: unknown): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: message, details },
    { status: 400 }
  );
}

export function notFound(message = "Not found"): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function serverError(
  message = "Internal server error",
  details?: unknown
): NextResponse<ApiError> {
  console.error("[API]", message, details);
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}

export function platformUnavailableMessage(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  if (/authentication is not configured/i.test(message)) {
    return "Authentication is not configured. Check the Supabase URL and publishable key, then restart the API.";
  }
  if (/Environment variable not found:\s*(DATABASE_URL|DIRECT_URL)/i.test(message)) {
    return "Database connection settings are missing. Set DATABASE_URL and DIRECT_URL in apps/api/.env or apps/api/.env.local, then restart the API.";
  }
  if (/Can't reach database server|ECONNREFUSED|ETIMEDOUT|P1001/i.test(message)) {
    return "Database server is unreachable. Verify DATABASE_URL and confirm PostgreSQL is running and accessible from the API.";
  }
  if (/P1013|invalid (?:database )?(?:connection )?url|invalid datasource url|url must start with|connection string.*invalid/i.test(message)) {
    return "The database connection URL is invalid. Check its format and URL-encode special characters in the username or password.";
  }
  return null;
}

/** Wraps a handler with standard try/catch + Zod error formatting. */
export async function withErrorHandling(
  handler: () => Promise<NextResponse<any>>
): Promise<NextResponse<any>> {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed", err.flatten().fieldErrors);
    }
    const unavailableMessage = platformUnavailableMessage(err);
    if (unavailableMessage) {
      return NextResponse.json(
        { success: false, error: unavailableMessage },
        { status: 503 }
      );
    }
    return serverError("Unexpected error", err instanceof Error ? err.message : err);
  }
}

/**
 * Generate a human-readable reference ID like "MCD-8409".
 */
export function generateReferenceId(): string {
  const num = Math.floor(1000 + Math.random() * 89000);
  return `MCD-${num}`;
}

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

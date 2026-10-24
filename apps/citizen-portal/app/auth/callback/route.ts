import { NextRequest, NextResponse } from "next/server";

/** Supabase Citizen email callbacks are retired; registration now verifies codes in the Clerk flow. */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login?reason=use_code_verification", request.nextUrl.origin));
}

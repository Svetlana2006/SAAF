import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const hasClerkConfig = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

// Clerk reads the standard NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and
// CLERK_SECRET_KEY environment variables. Avoid passing them as dynamic keys.
export default hasClerkConfig
  ? clerkMiddleware()
  : ((request: NextRequest) => NextResponse.next());

export const config = { matcher: ["/:path*"] };

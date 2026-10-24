import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk reads the standard NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and
// CLERK_SECRET_KEY environment variables. Avoid passing them as dynamic keys.
export default clerkMiddleware();

export const config = { matcher: ["/:path*"] };

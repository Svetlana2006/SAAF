import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/auth/callback", "/auth/set-password"]);

function copyCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

export async function proxy(request: NextRequest) {
  const basePath = request.nextUrl.basePath;
  const pathname = request.nextUrl.pathname.startsWith(`${basePath}/`)
    ? request.nextUrl.pathname.slice(basePath.length)
    : request.nextUrl.pathname === basePath
      ? "/"
      : request.nextUrl.pathname;
  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "NGO sign-in is not configured." }, { status: 503 });
    }
    return NextResponse.redirect(new URL(`${basePath}/login?reason=auth-config`, request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    if (pathname.startsWith("/api/")) {
      return copyCookies(response, NextResponse.json({ error: "Sign in to continue." }, { status: 401 }));
    }
    const loginUrl = new URL(`${basePath}/login`, request.url);
    loginUrl.searchParams.set("reason", "session");
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (user.app_metadata?.role !== "ngo") {
    if (pathname.startsWith("/api/")) {
      return copyCookies(response, NextResponse.json({ error: "NGO access is required." }, { status: 403 }));
    }
    const loginUrl = new URL(`${basePath}/login?reason=membership`, request.url);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

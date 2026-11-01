import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const basePath = request.nextUrl.basePath;
  const pathname = request.nextUrl.pathname.startsWith(`${basePath}/`)
    ? request.nextUrl.pathname.slice(basePath.length)
    : request.nextUrl.pathname === basePath
      ? "/"
      : request.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isAuthRoute = ["/login", "/register", "/auth/callback", "/auth/set-password"].includes(pathname);
  if (!url || !key) {
    if (isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL(`${basePath}/login?reason=auth-config`, request.url));
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (pathname === "/auth/callback" || pathname === "/auth/set-password") return response;
  if (pathname === "/login" || pathname === "/register") {
    if (user?.app_metadata?.role === "csr") return NextResponse.redirect(new URL(`${basePath}/`, request.url));
    return response;
  }
  const isApiRoute = pathname.startsWith("/api/");
  if (!user) {
    if (isApiRoute) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    return NextResponse.redirect(new URL(`${basePath}/login?reason=session`, request.url));
  }
  if (user.app_metadata?.role !== "csr") {
    if (isApiRoute) return NextResponse.json({ error: "CSR access required." }, { status: 403 });
    return NextResponse.redirect(new URL(`${basePath}/login?reason=role`, request.url));
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"] };

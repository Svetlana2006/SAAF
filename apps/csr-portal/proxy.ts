import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isAuthRoute = ["/login", "/register", "/auth/callback", "/auth/set-password"].includes(request.nextUrl.pathname);
  if (!url || !key) {
    if (isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL("/login?reason=auth-config", request.url));
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
  if (request.nextUrl.pathname === "/auth/callback" || request.nextUrl.pathname === "/auth/set-password") return response;
  if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") {
    if (user?.app_metadata?.role === "csr") return NextResponse.redirect(new URL("/", request.url));
    return response;
  }
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  if (!user) {
    if (isApiRoute) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    return NextResponse.redirect(new URL("/login?reason=session", request.url));
  }
  if (user.app_metadata?.role !== "csr") {
    if (isApiRoute) return NextResponse.json({ error: "CSR access required." }, { status: 403 });
    return NextResponse.redirect(new URL("/login?reason=role", request.url));
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"] };

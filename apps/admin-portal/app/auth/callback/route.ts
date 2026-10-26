import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@saaf/platform/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get("next") ?? "/auth/set-password";
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/auth/set-password";
  try {
    const supabase = await createClient();
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const rawType = searchParams.get("type");
    const supportedTypes: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];
    const type = supportedTypes.find(value => value === rawType);
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : { error: new Error("Invitation link is incomplete.") };
    if (result.error) return NextResponse.redirect(new URL("/login?reason=invite", origin));
    return NextResponse.redirect(new URL(destination, origin));
  } catch {
    return NextResponse.redirect(new URL("/login?reason=invite", origin));
  }
}


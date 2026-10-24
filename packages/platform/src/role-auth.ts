import { NextResponse } from "next/server";
import { createClient } from "./supabase/server";
import { hasTrustedRole, type TrustedRole } from "./auth-policy";

export type PortalRole = TrustedRole;

/** Roles come only from Supabase app_metadata, which clients cannot edit. */
export async function requirePortalRole(allowed: PortalRole[]) {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const role = user.app_metadata?.role;
  if (!hasTrustedRole(user, allowed)) {
    return NextResponse.json({ error: "You do not have permission to perform this action." }, { status: 403 });
  }
  return { user, role: role as PortalRole };
}

export function isRoleAuthResponse(value: Awaited<ReturnType<typeof requirePortalRole>>): value is NextResponse<{ error: string }> {
  return value instanceof NextResponse;
}

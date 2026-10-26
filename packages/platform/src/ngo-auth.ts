import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

export async function getNgoAccessState() {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return { kind: "auth_config_error" as const };
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { kind: "signed_out" as const };
  if (user.app_metadata?.role !== "ngo") return { kind: "forbidden" as const };

  try {
    const membership = await prisma.ngoMembership.findFirst({
      where: { supabaseUserId: user.id, isActive: true },
      include: { ngo: true },
    });
    return membership
      ? {
          kind: "member" as const,
          user: { id: user.id, email: user.email ?? "" },
          membership: { membershipId: membership.membershipId, ngoId: membership.ngoId, role: membership.role, isActive: membership.isActive },
          ngo: { ngoId: membership.ngo.ngoId, name: membership.ngo.name },
        }
      : { kind: "unlinked" as const, email: user.email ?? "" };
  } catch {
    return { kind: "database_error" as const };
  }
}

export async function getNgoPrincipal() {
  const state = await getNgoAccessState();
  return state.kind === "member" ? state : null;
}

export async function requireNgoPrincipal() {
  const state = await getNgoAccessState();
  if (state.kind === "member") return state;
  if (state.kind === "forbidden") return NextResponse.json({ error: "NGO access is required." }, { status: 403 });
  if (state.kind === "unlinked") return NextResponse.json({ error: "This login is not linked to an active NGO membership." }, { status: 403 });
  if (state.kind === "auth_config_error") return NextResponse.json({ error: "NGO portal session signing is not configured." }, { status: 503 });
  if (state.kind === "database_error") return NextResponse.json({ error: "NGO database schema is not ready." }, { status: 503 });
  return NextResponse.json({ error: "Sign in with an approved NGO account to continue." }, { status: 401 });
}

export function isNgoResponse(value: Awaited<ReturnType<typeof requireNgoPrincipal>>): value is NextResponse<{ error: string }> {
  return value instanceof NextResponse;
}

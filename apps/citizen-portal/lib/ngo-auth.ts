import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getNgoAccessState() {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return { kind: "auth_config_error" as const };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { kind: "signed_out" as const };
  try {
    const membership = await prisma.ngoMembership.findFirst({
      where: { supabaseUserId: user.id, isActive: true },
      include: { ngo: true },
      orderBy: { createdAt: "asc" },
    });
    return membership
      ? { kind: "member" as const, user, membership, ngo: membership.ngo }
      : { kind: "unlinked" as const, email: user.email };
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
  if (state.kind === "unlinked") return NextResponse.json({ error: "Your signed-in account is not linked to an active NGO membership." }, { status: 403 });
  if (state.kind === "auth_config_error") return NextResponse.json({ error: "Supabase URL or publishable key is missing." }, { status: 503 });
  if (state.kind === "database_error") return NextResponse.json({ error: "NGO database schema is not ready." }, { status: 503 });
  return NextResponse.json({ error: "Sign in with an approved NGO account to continue." }, { status: 401 });
}

export function isNgoResponse(value: Awaited<ReturnType<typeof requireNgoPrincipal>>): value is NextResponse<{ error: string }> {
  return value instanceof NextResponse;
}

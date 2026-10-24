import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

export async function requireCsrPrincipal() {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await createClient(); }
  catch { return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 }); }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (user.app_metadata?.role !== "csr") return NextResponse.json({ error: "CSR access is required." }, { status: 403 });

  try {
    const membership = await prisma.csrMembership.findFirst({
      where: { supabaseUserId: user.id, isActive: true },
      include: { organization: true },
    });
    if (!membership) return NextResponse.json({ error: "Your CSR organization access is not active." }, { status: 403 });
    return { user, membership, organization: membership.organization };
  } catch {
    return NextResponse.json({ error: "CSR data is unavailable. Apply the database migration and retry." }, { status: 503 });
  }
}

export function isCsrResponse(value: Awaited<ReturnType<typeof requireCsrPrincipal>>): value is NextResponse<{ error: string }> {
  return value instanceof NextResponse;
}

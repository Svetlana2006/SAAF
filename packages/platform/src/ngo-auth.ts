import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { NGO_SESSION_COOKIE, type NgoSession, verifyNgoSessionToken } from "./ngo-session";

export async function getNgoAccessState() {
  let session: NgoSession | null;
  try {
    const cookieStore = await cookies();
    session = verifyNgoSessionToken(cookieStore.get(NGO_SESSION_COOKIE)?.value);
  } catch {
    return { kind: "auth_config_error" as const };
  }
  if (!session) return { kind: "signed_out" as const };

  try {
    const rows = await prisma.$queryRaw<{
      membershipId: string;
      ngoId: string;
      role: string;
      loginEmail: string;
      ngoName: string;
    }[]>`
      SELECT m.membership_id AS "membershipId", m.ngo_id AS "ngoId",
        m.role, m.login_email AS "loginEmail", n.name AS "ngoName"
      FROM public.ngo_memberships m
      JOIN public.ngos n ON n.ngo_id = m.ngo_id
      WHERE m.membership_id = ${session.membershipId}
        AND m.login_email = ${session.email}
        AND m.ngo_id = ${session.ngoId}
        AND m.is_active = TRUE
      LIMIT 1
    `;
    const row = rows[0];
    return row
      ? {
          kind: "member" as const,
          user: { id: row.membershipId, email: row.loginEmail },
          membership: { membershipId: row.membershipId, ngoId: row.ngoId, role: row.role, isActive: true },
          ngo: { ngoId: row.ngoId, name: row.ngoName },
        }
      : { kind: "unlinked" as const, email: session.email };
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
  if (state.kind === "unlinked") return NextResponse.json({ error: "This login is not linked to an active NGO membership." }, { status: 403 });
  if (state.kind === "auth_config_error") return NextResponse.json({ error: "NGO portal session signing is not configured." }, { status: 503 });
  if (state.kind === "database_error") return NextResponse.json({ error: "NGO database schema is not ready." }, { status: 503 });
  return NextResponse.json({ error: "Sign in with an approved NGO account to continue." }, { status: 401 });
}

export function isNgoResponse(value: Awaited<ReturnType<typeof requireNgoPrincipal>>): value is NextResponse<{ error: string }> {
  return value instanceof NextResponse;
}

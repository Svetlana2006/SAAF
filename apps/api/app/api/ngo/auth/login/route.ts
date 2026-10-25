import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NGO_SESSION_COOKIE, NGO_SESSION_MAX_AGE_SECONDS, createNgoSessionToken } from "@saaf/platform/ngo-session";
import { verifyNgoPassword } from "@saaf/platform/ngo-password";
import { prisma } from "@saaf/platform/prisma";
import { rateLimit } from "@saaf/platform/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(1).max(256),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "ngo-login", 8, 15 * 60 * 1000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter your approved login and password." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter your approved login and password." }, { status: 400 });

  try {
    const rows = await prisma.$queryRaw<{
      membershipId: string;
      loginEmail: string;
      passwordHash: string;
      ngoId: string;
      role: string;
      ngoName: string;
    }[]>`
      SELECT m.membership_id AS "membershipId", m.login_email AS "loginEmail",
        m.password_hash AS "passwordHash", m.ngo_id AS "ngoId", m.role,
        n.name AS "ngoName"
      FROM public.ngo_memberships m
      JOIN public.ngos n ON n.ngo_id = m.ngo_id
      WHERE m.login_email = ${parsed.data.email}
        AND m.is_active = TRUE
        AND m.password_hash IS NOT NULL
      LIMIT 1
    `;
    const membership = rows[0];
    const passwordMatches = membership
      ? await verifyNgoPassword(parsed.data.password, membership.passwordHash)
      : false;
    if (!membership || !passwordMatches) {
      return NextResponse.json({ error: "Invalid login or password." }, { status: 401 });
    }

    const token = createNgoSessionToken({
      membershipId: membership.membershipId,
      email: membership.loginEmail,
      ngoId: membership.ngoId,
      ngoName: membership.ngoName,
      role: membership.role,
    });
    const response = NextResponse.json({ signedIn: true });
    response.cookies.set(NGO_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: NGO_SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("[ngo-auth] Login failed.", error);
    return NextResponse.json({ error: "NGO sign-in is temporarily unavailable." }, { status: 503 });
  }
}

import { createClerkClient, verifyToken, type User } from "@clerk/backend";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";

const CitizenMetadataSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(32).nullable().optional(),
});

export class CitizenEmailConflictError extends Error {
  constructor() {
    super("This email is already linked to a different account.");
    this.name = "CitizenEmailConflictError";
  }
}

export class CitizenEmailConfirmationRequiredError extends Error {
  constructor() {
    super("Confirm your email address before saving your Citizen profile.");
    this.name = "CitizenEmailConfirmationRequiredError";
  }
}

export async function resolveCitizenSession(request: Request) {
  const token = bearerToken(request);
  if (!token) return { citizen: null, response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return { citizen: null, response: NextResponse.json({ error: "Citizen authentication is not configured." }, { status: 503 }) };

  let subject: string;
  try {
    const claims = await verifyToken(token, {
      secretKey,
      authorizedParties: [process.env.CITIZEN_PORTAL_URL ?? "http://localhost:3001"],
    });
    if (!claims.sub) return { citizen: null, response: NextResponse.json({ error: "Invalid sign-in session." }, { status: 401 }) };
    subject = claims.sub;
  } catch {
    return { citizen: null, response: NextResponse.json({ error: "Your sign-in session is invalid or expired. Please sign in again." }, { status: 401 }) };
  }

  let user: User;
  try {
    const clerk = createClerkClient({ secretKey });
    user = await clerk.users.getUser(subject);
  } catch {
    return { citizen: null, response: NextResponse.json({ error: "Could not verify your Citizen account. Please try again." }, { status: 503 }) };
  }
  const trustedRole = user.publicMetadata.role;
  if (trustedRole && trustedRole !== "citizen") {
    return { citizen: null, response: NextResponse.json({ error: "This account cannot use the Citizen portal." }, { status: 403 }) };
  }
  if (!primaryVerifiedEmail(user)) {
    return { citizen: null, response: NextResponse.json({ error: "Verify your email address before continuing." }, { status: 403 }) };
  }

  try {
    return { citizen: await syncCitizenProfile(user), response: null };
  } catch (error) {
    if (error instanceof CitizenEmailConflictError) {
      return { citizen: null, response: NextResponse.json({ error: error.message }, { status: 409 }) };
    }
    if (error instanceof CitizenEmailConfirmationRequiredError) {
      return { citizen: null, response: NextResponse.json({ error: error.message }, { status: 403 }) };
    }
    return { citizen: null, response: NextResponse.json({ error: "Could not load your Citizen profile. Please try again." }, { status: 503 }) };
  }
}

/** Anonymous reports remain available without a token; invalid supplied tokens are rejected. */
export async function resolveOptionalCitizenSession(request: Request) {
  if (!bearerToken(request)) return { citizen: null, response: null };
  return resolveCitizenSession(request);
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function primaryVerifiedEmail(user: User) {
  const primary = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  return primary?.verification?.status === "verified" ? primary.emailAddress : null;
}

/** Only verified Clerk identities can create or update their own Citizen row. */
export async function syncCitizenProfile(user: User) {
  const verifiedEmail = primaryVerifiedEmail(user);
  if (!verifiedEmail) throw new CitizenEmailConfirmationRequiredError();
  const email = verifiedEmail.trim().toLowerCase();
  const metadata = CitizenMetadataSchema.safeParse(user.unsafeMetadata ?? {});
  const name = metadata.success && metadata.data.fullName
    ? metadata.data.fullName
    : [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || email.split("@")[0];
  const phone = metadata.success ? metadata.data.phone || null : null;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.citizen.findUnique({ where: { clerkUserId: user.id } });
    if (existing) {
      const emailOwner = await tx.citizen.findUnique({ where: { email } });
      if (emailOwner && emailOwner.citizenId !== existing.citizenId) throw new CitizenEmailConflictError();
      return tx.citizen.update({
        where: { citizenId: existing.citizenId },
        data: { email, name, phone },
      });
    }

    const emailMatch = await tx.citizen.findUnique({ where: { email } });
    if (emailMatch) {
      if (emailMatch.clerkUserId && emailMatch.clerkUserId !== user.id) throw new CitizenEmailConflictError();
      return tx.citizen.update({
        where: { citizenId: emailMatch.citizenId },
        data: { clerkUserId: user.id, name, phone },
      });
    }

    return tx.citizen.create({
      data: { clerkUserId: user.id, name, email, phone, role: "citizen" },
    });
  });
}

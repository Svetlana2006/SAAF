import { createHmac, timingSafeEqual } from "node:crypto";

export const NGO_SESSION_COOKIE = "saaf_ngo_session";
export const NGO_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export type NgoSession = {
  membershipId: string;
  email: string;
  ngoId: string;
  ngoName: string;
  role: string;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.NGO_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("NGO session signing is not configured.");
  return secret;
}

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest();
}

export function createNgoSessionToken(session: Omit<NgoSession, "expiresAt">) {
  const payload = Buffer.from(JSON.stringify({
    ...session,
    expiresAt: Math.floor(Date.now() / 1000) + NGO_SESSION_MAX_AGE_SECONDS,
  })).toString("base64url");
  return `${payload}.${signature(payload, getSessionSecret()).toString("base64url")}`;
}

export function verifyNgoSessionToken(token: string | undefined): NgoSession | null {
  if (!token) return null;
  const [payload, encodedSignature, ...extra] = token.split(".");
  if (!payload || !encodedSignature || extra.length > 0) return null;

  let actualSignature: Buffer;
  try {
    actualSignature = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }
  const expectedSignature = signature(payload, getSessionSecret());
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as NgoSession;
    if (
      typeof session.membershipId !== "string" ||
      typeof session.email !== "string" ||
      typeof session.ngoId !== "string" ||
      typeof session.ngoName !== "string" ||
      typeof session.role !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null;
    return session;
  } catch {
    return null;
  }
}

import { NextResponse } from "next/server";
import { NGO_SESSION_COOKIE } from "@saaf/platform/ngo-session";

export async function POST() {
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(NGO_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

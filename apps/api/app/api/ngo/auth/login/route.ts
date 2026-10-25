import { NextResponse } from "next/server";

/** NGO credentials are authenticated by Supabase Auth in the portal client. */
export async function POST() {
  return NextResponse.json(
    { error: "This login endpoint has been retired. Sign in through the NGO portal." },
    { status: 410 },
  );
}

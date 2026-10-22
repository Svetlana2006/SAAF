import { NextResponse } from "next/server";
import { requireNgoPrincipal, isNgoResponse } from "@saaf/platform/ngo-auth";

export async function GET() {
  const principal = await requireNgoPrincipal();
  if (isNgoResponse(principal)) return principal;
  return NextResponse.json({ user: { id: principal.user.id, email: principal.user.email }, membership: principal.membership, ngo: principal.ngo });
}

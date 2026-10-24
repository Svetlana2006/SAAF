import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@saaf/platform/rate-limit";
import { CitizenEmailConflictError, CitizenEmailConfirmationRequiredError, resolveCitizenSession } from "@saaf/platform/citizen-auth";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "citizen-profile-sync", 20, 60 * 60 * 1000);
  if (limited) return limited;
  try {
    const { citizen, response } = await resolveCitizenSession(request);
    if (response) return response;
    if (!citizen) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    return NextResponse.json({ profile: { citizenId: citizen.citizenId, name: citizen.name, email: citizen.email, phone: citizen.phone } });
  } catch (cause) {
    if (cause instanceof CitizenEmailConflictError) return NextResponse.json({ error: cause.message }, { status: 409 });
    if (cause instanceof CitizenEmailConfirmationRequiredError) return NextResponse.json({ error: cause.message }, { status: 403 });
    return NextResponse.json({ error: "Could not save your Citizen profile. Please try again." }, { status: 503 });
  }
}

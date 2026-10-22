import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saaf/platform/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@saaf/platform/ngo-auth";

export async function GET(request: NextRequest) {
  const principal = await requireNgoPrincipal();
  if (isNgoResponse(principal)) return principal;
  const status = request.nextUrl.searchParams.get("status");
  const missions = await prisma.mission.findMany({ where: { ngoId: principal.ngo.ngoId, ...(status ? { status } : {}) }, orderBy: { scheduledDate: "asc" }, include: { location: true, report: true, missionVolunteers: { include: { volunteer: true } }, missionActivities: { orderBy: { createdAt: "desc" }, take: 10 }, evidences: { orderBy: { createdAt: "desc" } }, statusEvents: { orderBy: { createdAt: "desc" } } } });
  return NextResponse.json({ missions });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requireCsrPrincipal, isCsrResponse } from "@saaf/platform/csr-auth";

export async function GET(request: NextRequest) {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  const view = z.enum(["available", "supported", "all"]).safeParse(request.nextUrl.searchParams.get("view") ?? "available");
  if (!view.success) return NextResponse.json({ error: "Invalid mission view." }, { status: 400 });
  const csrOrganizationId = principal.organization.csrOrganizationId;
  const where = view.data === "available"
    ? { isActive: true, status: { not: "completed" }, csrGrants: { none: { csrOrganizationId } } }
    : view.data === "supported"
      ? { csrGrants: { some: { csrOrganizationId } } }
      : { OR: [{ csrGrants: { some: { csrOrganizationId } } }, { isActive: true, status: { not: "completed" } }] };
  const missions = await prisma.mission.findMany({
    where,
    orderBy: { scheduledDate: "asc" },
    take: 100,
    select: {
      missionId: true, missionType: true, priority: true, status: true, scheduledDate: true, estimatedCost: true, isActive: true,
      location: { select: { nameArea: true, wardZone: true, address: true } },
      ngo: { select: { name: true } },
      impactReports: { select: { impactId: true, totalWasteRemoved: true, volunteerHours: true, status: true, createdAt: true } },
      csrGrants: { where: { csrOrganizationId }, select: { grantId: true, amount: true, status: true, notes: true, createdAt: true } },
    },
  });
  return NextResponse.json({ missions });
}

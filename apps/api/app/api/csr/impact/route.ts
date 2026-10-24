import { NextResponse } from "next/server";
import { prisma } from "@saaf/platform/prisma";
import { requireCsrPrincipal, isCsrResponse } from "@saaf/platform/csr-auth";

export async function GET() {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  const reports = await prisma.impactReport.findMany({
    where: { mission: { csrGrants: { some: { csrOrganizationId: principal.organization.csrOrganizationId } } } },
    orderBy: { createdAt: "desc" },
    select: { impactId: true, totalCleanedLocations: true, totalWasteRemoved: true, volunteerHours: true, recurringHotspotsResolved: true, environmentalBenefits: true, status: true, createdAt: true, mission: { select: { missionId: true, missionType: true, status: true, ngo: { select: { name: true } }, location: { select: { nameArea: true, wardZone: true } }, csrGrants: { where: { csrOrganizationId: principal.organization.csrOrganizationId }, select: { amount: true, status: true } } } } },
  });
  return NextResponse.json({ reports });
}

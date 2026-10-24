import { NextResponse } from "next/server";
import { prisma } from "@saaf/platform/prisma";
import { requireCsrPrincipal, isCsrResponse } from "@saaf/platform/csr-auth";

export async function GET() {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  const csrOrganizationId = principal.organization.csrOrganizationId;
  const [grants, activeMissions, impact] = await Promise.all([
    prisma.csrGrant.aggregate({ where: { csrOrganizationId, status: { in: ["committed", "released"] } }, _sum: { amount: true }, _count: { grantId: true } }),
    prisma.csrGrant.count({ where: { csrOrganizationId, status: "committed", mission: { isActive: true, status: { not: "completed" } } } }),
    prisma.impactReport.aggregate({ where: { mission: { csrGrants: { some: { csrOrganizationId } } } }, _sum: { totalWasteRemoved: true, volunteerHours: true }, _count: { impactId: true } }),
  ]);
  return NextResponse.json({
    organization: { name: principal.organization.name },
    metrics: { committedAmount: grants._sum.amount ?? 0, grants: grants._count.grantId, activeMissions, verifiedImpactReports: impact._count.impactId, wasteRemoved: impact._sum.totalWasteRemoved ?? 0, volunteerHours: impact._sum.volunteerHours ?? 0 },
  });
}

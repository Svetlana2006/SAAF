import { NextResponse } from "next/server";
import { prisma } from "@saaf/platform/prisma";
import { requireCsrPrincipal, isCsrResponse } from "@saaf/platform/csr-auth";
import { calculateCsrDashboardMetrics, getFollowUpWindow, summarizeCsrFollowUps } from "@saaf/platform/csr-metrics";

export async function GET() {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  const csrOrganizationId = principal.organization.csrOrganizationId;
  try {
    const [grants, missions, verifiedReports, completedMissions, reportedImpact] = await Promise.all([
      prisma.csrGrant.aggregate({
        where: { csrOrganizationId, status: { in: ["committed", "released"] } },
        _sum: { amount: true }, _count: { grantId: true },
      }),
      prisma.mission.findMany({
        where: { csrGrants: { some: { csrOrganizationId, status: { in: ["committed", "released"] } } } },
        select: { missionId: true, status: true },
      }),
      prisma.impactReport.count({
        where: { status: "verified", mission: { csrGrants: { some: { csrOrganizationId, status: { in: ["committed", "released"] } } } } },
      }),
      prisma.mission.findMany({
        where: { status: "completed", csrGrants: { some: { csrOrganizationId, status: { in: ["committed", "released"] } } } },
        select: { missionId: true, locationId: true, statusEvents: { where: { toStatus: "completed" }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
      }),
      prisma.impactReport.aggregate({
        where: { mission: { csrGrants: { some: { csrOrganizationId, status: { in: ["committed", "released"] } } } } },
        _sum: { totalWasteRemoved: true, volunteerHours: true },
      }),
    ]);
    const followUpRecords = await Promise.all(completedMissions.flatMap(mission => {
      const completedAt = mission.statusEvents[0]?.createdAt;
      if (!completedAt) return [];
      const window = getFollowUpWindow(completedAt);
      if (window.eligibleAt > new Date()) return [];
      return [prisma.report.count({ where: { locationId: mission.locationId, createdAt: { gte: window.start, lt: window.end } } }).then(reportsAfterCompletion => ({ missionId: mission.missionId, locationId: mission.locationId, completedAt, reportsAfterCompletion }))];
    }));
    return NextResponse.json({
      organization: { name: principal.organization.name },
      reportingPeriod: "All recorded commitments and outcomes",
      metrics: { ...calculateCsrDashboardMetrics({ committedAmount: grants._sum.amount ?? 0, approvedFundingBudget: principal.organization.approvedFundingBudget, grantRecords: grants._count.grantId, missionStatuses: missions.map(mission => mission.status), verifiedImpactReports: verifiedReports }), reportedWasteRemovedKg: reportedImpact._sum.totalWasteRemoved ?? 0, reportedVolunteerHours: reportedImpact._sum.volunteerHours ?? 0 },
      followUp: { ...summarizeCsrFollowUps(followUpRecords), completionTimestampsUnavailable: completedMissions.filter(mission => mission.statusEvents.length === 0).length },
    });
  } catch (error) {
    console.error("[csr-dashboard] query failed", error);
    return NextResponse.json({ error: "CSR dashboard data is unavailable. Please retry." }, { status: 503 });
  }
}

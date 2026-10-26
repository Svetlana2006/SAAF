import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";
import { calculateAdminDashboardMetrics } from "@saaf/platform/admin-policy";

const filtersSchema = z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional() });

export async function GET(request: NextRequest) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const parsed = filtersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success || (parsed.data.from && parsed.data.to && parsed.data.from > parsed.data.to)) {
    return NextResponse.json({ error: "Choose a valid date range." }, { status: 400 });
  }
  const { from, to } = parsed.data;
  const toValue = request.nextUrl.searchParams.get("to");
  if (to && toValue && /^\d{4}-\d{2}-\d{2}$/.test(toValue)) to.setUTCHours(23, 59, 59, 999);
  const createdAt = from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;
  const dateFilter = createdAt ? { createdAt } : {};

  try {
    const [
      reportStatuses, reportsBySeverity, reportsByCategory,
      missionStatuses, activeMemberships, volunteerCount, pendingEvidence,
      verifiedEvidence, activeHotspots, recurrenceRows, grantTotals,
      fundingRecordCount, auditEvents, missionEvents, missionActivities, recentReports,
    ] = await Promise.all([
      prisma.report.groupBy({ by: ["status"], where: dateFilter, _count: { _all: true } }),
      prisma.report.groupBy({ by: ["severity"], where: dateFilter, _count: { _all: true } }),
      prisma.report.groupBy({ by: ["category"], where: dateFilter, _count: { _all: true } }),
      prisma.mission.groupBy({ by: ["status"], where: dateFilter, _count: { _all: true } }),
      prisma.ngoMembership.findMany({ where: { isActive: true }, select: { ngoId: true }, distinct: ["ngoId"] }),
      prisma.volunteer.count({ where: dateFilter }),
      prisma.evidence.count({ where: { verificationStatus: "pending", ...(createdAt ? { createdAt } : {}) } }),
      prisma.evidence.count({ where: { verificationStatus: "approved", ...(createdAt ? { createdAt } : {}) } }),
      prisma.hotspot.count({ where: { status: "active" } }),
      prisma.report.groupBy({ by: ["locationId"], where: { ...dateFilter, locationId: { not: null } }, _count: { _all: true } }),
      prisma.csrGrant.groupBy({ by: ["status"], where: createdAt ? { createdAt } : {}, _sum: { amount: true }, _count: { _all: true } }),
      prisma.funding.count({ where: createdAt ? { createdAt } : {} }),
      prisma.adminAuditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 12, select: { auditId: true, actorUserId: true, actionType: true, recordType: true, recordId: true, note: true, createdAt: true } }),
      prisma.missionStatusEvent.findMany({ orderBy: { createdAt: "desc" }, take: 12, select: { eventId: true, missionId: true, fromStatus: true, toStatus: true, note: true, createdAt: true } }),
      prisma.missionActivity.findMany({ orderBy: { createdAt: "desc" }, take: 12, select: { activityId: true, missionId: true, activityType: true, description: true, status: true, createdAt: true } }),
      prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 12, select: { reportId: true, category: true, status: true, createdAt: true } }),
    ]);

    const recurringRows = recurrenceRows.filter(row => row.locationId && row._count._all > 1).sort((a, b) => b._count._all - a._count._all).slice(0, 10);
    const locationIds = recurringRows.flatMap(row => row.locationId ? [row.locationId] : []);
    const locations = locationIds.length ? await prisma.location.findMany({ where: { locationId: { in: locationIds } }, select: { locationId: true, nameArea: true, address: true, wardZone: true } }) : [];
    const locationById = new Map(locations.map(location => [location.locationId, location]));
    const metrics = calculateAdminDashboardMetrics({
      reports: reportStatuses.map(row => ({ status: row.status, count: row._count._all })),
      missions: missionStatuses.map(row => ({ status: row.status, count: row._count._all })),
      grants: grantTotals.map(row => ({ status: row.status, count: row._count._all, amount: row._sum.amount ?? 0 })),
      activeNgos: activeMemberships.length,
      registeredVolunteers: volunteerCount,
      pendingEvidence,
      approvedEvidence: verifiedEvidence,
      activeHotspots,
      legacyFundingRecords: fundingRecordCount,
    });
    const recentActivity = [
      ...auditEvents.map(event => ({ id: event.auditId, source: "admin", action: event.actionType, recordType: event.recordType, recordId: event.recordId, actor: event.actorUserId, note: event.note, createdAt: event.createdAt })),
      ...missionEvents.map(event => ({ id: event.eventId, source: "mission", action: `${event.fromStatus ?? "created"} → ${event.toStatus}`, recordType: "mission", recordId: event.missionId, actor: null, note: event.note, createdAt: event.createdAt })),
      ...missionActivities.map(event => ({ id: event.activityId, source: "mission_activity", action: event.activityType, recordType: "mission", recordId: event.missionId, actor: null, note: `${event.status}: ${event.description}`, createdAt: event.createdAt })),
      ...recentReports.map(report => ({ id: report.reportId, source: "report", action: "Report submitted", recordType: "report", recordId: report.reportId, actor: null, note: `${report.category} · ${report.status}`, createdAt: report.createdAt })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 15);

    return NextResponse.json({
      range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
      reports: { total: metrics.reportTotal, statuses: metrics.reportStatuses, bySeverity: reportsBySeverity.map(row => ({ label: row.severity, count: row._count._all })), byCategory: reportsByCategory.map(row => ({ label: row.category, count: row._count._all })) },
      missions: { total: metrics.missionTotal, statuses: metrics.missionStatuses },
      activeNgos: metrics.activeNgos,
      registeredVolunteers: metrics.registeredVolunteers,
      evidence: { pending: metrics.pendingEvidence, approved: metrics.approvedEvidence },
      hotspots: { active: metrics.activeHotspots, recurringLocations: recurringRows.map(row => ({ locationId: row.locationId, count: row._count._all, location: row.locationId ? locationById.get(row.locationId) ?? null : null })) },
      csr: { commitments: metrics.csrCommitmentTotal, byStatus: metrics.grantStatuses, legacyFundingRecords: metrics.legacyFundingRecords },
      recentActivity,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin-dashboard] query failed", error);
    return NextResponse.json({ error: "Admin dashboard data is unavailable. Apply the current database migrations and retry." }, { status: 503 });
  }
}

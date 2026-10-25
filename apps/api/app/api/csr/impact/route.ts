import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { buildCsrCsv, getFollowUpWindow, summarizeCsrFollowUps } from "@saaf/platform/csr-metrics";
import { requireCsrPrincipal, isCsrResponse } from "@saaf/platform/csr-auth";

export async function GET(request: NextRequest) {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  const filters = z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional(), location: z.string().trim().max(120).optional(), category: z.string().trim().max(80).optional() }).safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!filters.success || (filters.data.from && filters.data.to && filters.data.from > filters.data.to)) return NextResponse.json({ error: "Invalid impact report filters." }, { status: 400 });
  const reportFilters = filters.data;
  const toDate = request.nextUrl.searchParams.get("to");
  if (reportFilters.to && toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate)) reportFilters.to.setUTCHours(23, 59, 59, 999);
  const csrOrganizationId = principal.organization.csrOrganizationId;
  try {
    const [reports, completedMissions] = await Promise.all([
      prisma.impactReport.findMany({
        where: {
          ...(reportFilters.from || reportFilters.to ? { createdAt: { ...(reportFilters.from ? { gte: reportFilters.from } : {}), ...(reportFilters.to ? { lte: reportFilters.to } : {}) } } : {}),
          mission: {
            csrGrants: { some: { csrOrganizationId, status: { in: ["committed", "released"] } } },
            ...(reportFilters.location ? { location: { nameArea: { contains: reportFilters.location, mode: "insensitive" } } } : {}),
            ...(reportFilters.category ? { report: { category: { contains: reportFilters.category, mode: "insensitive" } } } : {}),
          },
        },
        orderBy: { createdAt: "desc" }, take: 500,
        select: {
          impactId: true, totalCleanedLocations: true, totalWasteRemoved: true, volunteerHours: true, recurringHotspotsResolved: true, environmentalBenefits: true, status: true, createdAt: true,
          mission: { select: {
            missionId: true, missionType: true, status: true, locationId: true, ngo: { select: { name: true } }, location: { select: { nameArea: true, wardZone: true } },
            report: { select: { reportId: true, category: true, status: true, citizenConfirmations: { select: { status: true } } } },
            csrGrants: { where: { csrOrganizationId }, select: { amount: true, status: true } },
            evidences: { select: { type: true, verified: true } },
          } },
        },
      }),
      prisma.mission.findMany({
        where: { status: "completed", csrGrants: { some: { csrOrganizationId, status: { in: ["committed", "released"] } } } },
        select: { missionId: true, locationId: true, statusEvents: { where: { toStatus: "completed" }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
      }),
    ]);

    const followUpRecords = await Promise.all(completedMissions.flatMap(mission => {
      const completedAt = mission.statusEvents[0]?.createdAt;
      if (!completedAt) return [];
      const window = getFollowUpWindow(completedAt);
      if (window.eligibleAt > new Date()) return [];
      return [prisma.report.count({ where: { locationId: mission.locationId, createdAt: { gte: window.start, lt: window.end } } }).then(reportsAfterCompletion => ({ missionId: mission.missionId, locationId: mission.locationId, completedAt, reportsAfterCompletion }))];
    }));

    const summary = summarizeCsrFollowUps(followUpRecords);
    const responseData = {
      reports,
      followUp: {
        ...summary,
        definition: "Eligible completed missions with a recorded completion timestamp and a full 30 days elapsed; repeat reports are reports recorded at the same location during the following 30 days.",
        evidenceUnavailable: completedMissions.filter(mission => mission.statusEvents.length === 0).length,
      },
    };
    if (request.nextUrl.searchParams.get("format") === "csv") {
      const headers = ["record_type", "impact_id", "mission_id", "mission_status", "impact_report_status", "reported_at", "location", "ward", "ngo", "category", "committed_amount", "waste_removed_kg", "volunteer_hours", "locations_cleaned_reported", "hotspots_resolved_reported", "report_status", "citizen_feedback", "before_evidence", "after_evidence", "verified_evidence_count", "follow_up_window_days", "eligible_completed_missions", "missions_with_no_recorded_repeat_reports", "repeat_reports", "completion_timestamps_unavailable"];
      const rows = reports.map(report => {
        const evidence = report.mission.evidences;
        return ["impact", report.impactId, report.mission.missionId, report.mission.status, report.status, report.createdAt.toISOString(), report.mission.location.nameArea, report.mission.location.wardZone, report.mission.ngo.name, report.mission.report?.category ?? "", report.mission.csrGrants.reduce((sum, grant) => sum + grant.amount, 0), report.totalWasteRemoved, report.volunteerHours, report.totalCleanedLocations, report.recurringHotspotsResolved, report.mission.report?.status ?? "", report.mission.report?.citizenConfirmations.map(value => value.status).join("; ") ?? "", evidence.some(item => item.type === "before") ? "present" : "missing", evidence.some(item => item.type === "after") ? "present" : "missing", evidence.filter(item => item.verified).length];
      });
      rows.push(["30_day_follow_up_summary", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", summary.windowDays, summary.eligibleMissions, summary.missionsWithNoRecordedRepeatReports, summary.repeatReports, responseData.followUp.evidenceUnavailable]);
      const csv = buildCsrCsv(headers, rows);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=saaf-csr-impact.csv", "Cache-Control": "no-store" } });
    }
    return NextResponse.json(responseData, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[csr-impact] query failed", error);
    return NextResponse.json({ error: "Impact data is unavailable. Please retry." }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@saaf/platform/prisma";
import { requireCsrPrincipal, isCsrResponse } from "@saaf/platform/csr-auth";
import { csrMissionViewScope, scopeMissionDetailsToOwnGrants } from "@saaf/platform/csr-policy";
import { CsrMissionQuerySchema } from "@/lib/csr-input";

export async function GET(request: NextRequest) {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  const parsed = CsrMissionQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success || (parsed.data.from && parsed.data.to && parsed.data.from > parsed.data.to)) return NextResponse.json({ error: "Invalid mission filters.", details: parsed.success ? undefined : parsed.error.flatten().fieldErrors }, { status: 400 });
  const filters = parsed.data;
  const toDate = request.nextUrl.searchParams.get("to");
  if (filters.to && toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate)) filters.to.setUTCHours(23, 59, 59, 999);
  const csrOrganizationId = principal.organization.csrOrganizationId;
  const viewClause = csrMissionViewScope(csrOrganizationId, filters.view) as Prisma.MissionWhereInput;
  const conditions: Prisma.MissionWhereInput[] = [viewClause];
  if (filters.status) conditions.push({ status: filters.status });
  if (filters.fundingStatus) conditions.push({ csrGrants: { some: { csrOrganizationId, status: filters.fundingStatus } } });
  if (filters.category) conditions.push({ missionType: { contains: filters.category, mode: "insensitive" } });
  if (filters.from || filters.to) conditions.push({ scheduledDate: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } });
  if (filters.location) conditions.push({ location: { nameArea: { contains: filters.location, mode: "insensitive" } } });
  if (filters.ngo) conditions.push({ ngo: { name: { contains: filters.ngo, mode: "insensitive" } } });
  if (filters.q) conditions.push({ OR: [
      { missionType: { contains: filters.q, mode: "insensitive" } },
      { ngo: { name: { contains: filters.q, mode: "insensitive" } } },
      { location: { nameArea: { contains: filters.q, mode: "insensitive" } } },
      { location: { wardZone: { contains: filters.q, mode: "insensitive" } } },
  ] });
  const where: Prisma.MissionWhereInput = { AND: conditions };
  try {
    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where, orderBy: [{ scheduledDate: "desc" }, { missionId: "asc" }], take: filters.limit, skip: filters.offset,
        select: {
          missionId: true, missionType: true, priority: true, status: true, scheduledDate: true, estimatedCost: true, actualCost: true, isActive: true, reportId: true,
          location: { select: { locationId: true, nameArea: true, wardZone: true, address: true, isHotspot: true } },
          ngo: { select: { ngoId: true, name: true } },
          report: { select: { reportId: true, category: true, status: true, createdAt: true } },
          impactReports: { orderBy: { createdAt: "desc" }, select: { impactId: true, totalWasteRemoved: true, volunteerHours: true, status: true, createdAt: true } },
          evidences: { orderBy: { createdAt: "asc" }, select: { evidenceId: true, type: true, photoUrl: true, description: true, timestamp: true, verified: true, verifiedBy: true } },
          missionActivities: { orderBy: { createdAt: "desc" }, select: { activityId: true, status: true, progressPercent: true, createdAt: true } },
          statusEvents: { orderBy: { createdAt: "asc" }, select: { fromStatus: true, toStatus: true, createdAt: true } },
          csrGrants: { where: { csrOrganizationId }, select: { grantId: true, amount: true, status: true, notes: true, createdAt: true, authorizedBy: true } },
        },
      }), prisma.mission.count({ where }),
    ]);
    const scopedMissions = missions.map(scopeMissionDetailsToOwnGrants);
    return NextResponse.json({ missions: scopedMissions, page: { limit: filters.limit, offset: filters.offset, total } });
  } catch (error) {
    console.error("[csr-missions] query failed", error);
    return NextResponse.json({ error: "Mission data is unavailable. Please retry." }, { status: 503 });
  }
}

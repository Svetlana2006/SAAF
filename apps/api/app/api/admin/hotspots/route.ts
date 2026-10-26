import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

const querySchema = z.object({ q: z.string().trim().max(160).optional(), category: z.string().trim().max(80).optional(), severity: z.string().trim().max(40).optional(), page: z.coerce.number().int().min(1).default(1) });

export async function GET(request: NextRequest) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const filters = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!filters.success) return NextResponse.json({ error: "Invalid hotspot filters." }, { status: 400 });
  const { q, category, severity, page } = filters.data;
  const locationWhere = {
    ...(q ? { OR: [
      { nameArea: { contains: q, mode: "insensitive" as const } },
      { address: { contains: q, mode: "insensitive" as const } },
      { wardZone: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
    reports: { some: { ...(category ? { category: { contains: category, mode: "insensitive" as const } } : {}), ...(severity ? { severity: { equals: severity, mode: "insensitive" as const } } : {}) } },
  };
  try {
    const take = 30;
    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where: locationWhere, orderBy: { nameArea: "asc" }, skip: (page - 1) * take, take,
        select: {
          locationId: true, nameArea: true, address: true, wardZone: true, latitude: true, longitude: true, isHotspot: true,
          reports: { where: { ...(category ? { category: { contains: category, mode: "insensitive" } } : {}), ...(severity ? { severity: { equals: severity, mode: "insensitive" } } : {}) }, orderBy: { createdAt: "desc" }, take: 30, select: { reportId: true, category: true, severity: true, status: true, createdAt: true, missions: { select: { missionId: true, status: true } } } },
          hotspots: { select: { hotspotId: true, recurrenceCount: true, status: true, lastCleanedDate: true, createdAt: true, interventions: { select: { interventionId: true, type: true, status: true, createdAt: true } } } },
        },
      }),
      prisma.location.count({ where: locationWhere }),
    ]);
    const reportGroups = locations.length ? await prisma.report.groupBy({
      by: ["locationId", "status"],
      where: { locationId: { in: locations.map(location => location.locationId) }, ...(category ? { category: { contains: category, mode: "insensitive" } } : {}), ...(severity ? { severity: { equals: severity, mode: "insensitive" } } : {}) },
      _count: { _all: true },
    }) : [];
    const counts = new Map<string, { reports: number; unresolved: number }>();
    for (const row of reportGroups) {
      if (!row.locationId) continue;
      const current = counts.get(row.locationId) ?? { reports: 0, unresolved: 0 };
      current.reports += row._count._all;
      if (row.status !== "completed") current.unresolved += row._count._all;
      counts.set(row.locationId, current);
    }
    return NextResponse.json({ locations: locations.map(location => {
      const count = counts.get(location.locationId) ?? { reports: 0, unresolved: 0 };
      return { ...location, reportCount: count.reports, recurring: count.reports > 1, unresolvedReports: count.unresolved };
    }), page, pageSize: take, total, pages: Math.ceil(total / take), recurrenceDefinition: "Recurrence counts reports linked to the same location record; nearby-coordinate matching is not available." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin-hotspots] query failed", error);
    return NextResponse.json({ error: "Hotspot and recurrence data are unavailable." }, { status: 503 });
  }
}

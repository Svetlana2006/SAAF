import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

const querySchema = z.object({ q: z.string().trim().max(160).optional(), status: z.string().trim().max(40).optional(), ngo: z.string().trim().max(120).optional(), ward: z.string().trim().max(80).optional(), from: z.coerce.date().optional(), to: z.coerce.date().optional(), page: z.coerce.number().int().min(1).default(1) });

export async function GET(request: NextRequest) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const filters = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!filters.success || (filters.data.from && filters.data.to && filters.data.from > filters.data.to)) return NextResponse.json({ error: "Invalid mission filters." }, { status: 400 });
  const { q, status, ngo, ward, from, to, page } = filters.data;
  const toValue = request.nextUrl.searchParams.get("to");
  if (to && toValue && /^\d{4}-\d{2}-\d{2}$/.test(toValue)) to.setUTCHours(23, 59, 59, 999);
  const where = {
    ...(status ? { status } : {}),
    ...(ngo ? { ngo: { name: { contains: ngo, mode: "insensitive" as const } } } : {}),
    ...(ward ? { location: { wardZone: { contains: ward, mode: "insensitive" as const } } } : {}),
    ...(from || to ? { scheduledDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(q ? { OR: [
      { missionId: { contains: q, mode: "insensitive" as const } },
      { missionType: { contains: q, mode: "insensitive" as const } },
      { leadNgo: { contains: q, mode: "insensitive" as const } },
      { ngo: { name: { contains: q, mode: "insensitive" as const } } },
      { location: { nameArea: { contains: q, mode: "insensitive" as const } } },
      { location: { address: { contains: q, mode: "insensitive" as const } } },
      { location: { wardZone: { contains: q, mode: "insensitive" as const } } },
      { report: { category: { contains: q, mode: "insensitive" as const } } },
    ] } : {}),
  };
  try {
    const take = 40;
    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where, orderBy: [{ scheduledDate: "desc" }, { createdAt: "desc" }], skip: (page - 1) * take, take,
        select: {
          missionId: true, missionType: true, priority: true, status: true, assignedTo: true, scheduledDate: true, estimatedCost: true, actualCost: true, totalSlots: true, filledSlots: true, createdAt: true,
          ngo: { select: { ngoId: true, name: true } },
          location: { select: { locationId: true, nameArea: true, address: true, wardZone: true, latitude: true, longitude: true } },
          report: { select: { reportId: true, category: true, severity: true, status: true, createdAt: true } },
          missionVolunteers: { select: { status: true, role: true, volunteer: { select: { volunteerId: true, name: true, skills: true } } } },
          missionActivities: { orderBy: { createdAt: "desc" }, take: 10, select: { activityId: true, activityType: true, description: true, status: true, progressPercent: true, createdAt: true } },
          evidences: { orderBy: { createdAt: "desc" }, select: { evidenceId: true, type: true, photoUrl: true, description: true, timestamp: true, locationLat: true, locationLong: true, verified: true, verificationStatus: true, reviewedBy: true, reviewedAt: true, reviewReason: true } },
          statusEvents: { orderBy: { createdAt: "desc" }, take: 15, select: { eventId: true, fromStatus: true, toStatus: true, note: true, createdAt: true } },
          csrGrants: { select: { amount: true, status: true, organization: { select: { name: true } } } },
          impactReports: { select: { impactId: true, status: true, createdAt: true } },
        },
      }),
      prisma.mission.count({ where }),
    ]);
    return NextResponse.json({ missions, page, pageSize: take, total, pages: Math.ceil(total / take), asOf: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin-missions] query failed", error);
    return NextResponse.json({ error: "Mission data is unavailable. Please retry." }, { status: 503 });
  }
}

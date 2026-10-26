import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

const querySchema = z.object({
  q: z.string().trim().max(160).optional(),
  status: z.string().trim().max(40).optional(),
  severity: z.string().trim().max(40).optional(),
  category: z.string().trim().max(80).optional(),
  ward: z.string().trim().max(80).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export async function GET(request: NextRequest) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const filters = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!filters.success || (filters.data.from && filters.data.to && filters.data.from > filters.data.to)) {
    return NextResponse.json({ error: "Invalid report filters." }, { status: 400 });
  }
  const { q, status, severity, category, ward, from, to, page } = filters.data;
  const toValue = request.nextUrl.searchParams.get("to");
  if (to && toValue && /^\d{4}-\d{2}-\d{2}$/.test(toValue)) to.setUTCHours(23, 59, 59, 999);
  const where = {
    ...(status ? { status } : {}),
    ...(severity ? { severity: { equals: severity, mode: "insensitive" as const } } : {}),
    ...(category ? { category: { contains: category, mode: "insensitive" as const } } : {}),
    ...(ward ? { location: { wardZone: { contains: ward, mode: "insensitive" as const } } } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(q ? { OR: [
      { reportId: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
      { category: { contains: q, mode: "insensitive" as const } },
      { location: { nameArea: { contains: q, mode: "insensitive" as const } } },
      { location: { address: { contains: q, mode: "insensitive" as const } } },
      { location: { wardZone: { contains: q, mode: "insensitive" as const } } },
    ] } : {}),
  };
  try {
    const take = 50;
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take,
        select: {
          reportId: true, category: true, description: true, severity: true, status: true, isAnonymous: true, createdAt: true,
          location: { select: { locationId: true, nameArea: true, address: true, wardZone: true, latitude: true, longitude: true, isHotspot: true } },
          images: { orderBy: { uploadedAt: "desc" }, select: { imageId: true, photoUrl: true, purpose: true, uploadedAt: true } },
          missions: { select: { missionId: true, status: true, ngo: { select: { name: true } }, statusEvents: { orderBy: { createdAt: "desc" }, take: 10, select: { fromStatus: true, toStatus: true, note: true, createdAt: true } } } },
          ngoOffers: { select: { offerId: true, status: true, ngo: { select: { name: true } } } },
          citizenConfirmations: { select: { status: true, createdAt: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);
    const audit = reports.length ? await prisma.adminAuditEvent.findMany({
      where: { recordType: "report", recordId: { in: reports.map(report => report.reportId) } },
      orderBy: { createdAt: "desc" }, select: { auditId: true, recordId: true, actionType: true, actorUserId: true, previousValue: true, newValue: true, note: true, createdAt: true },
    }) : [];
    const auditByReport = new Map<string, typeof audit>();
    for (const event of audit) auditByReport.set(event.recordId, [...(auditByReport.get(event.recordId) ?? []), event]);
    return NextResponse.json({ reports: reports.map(report => ({ ...report, adminHistory: auditByReport.get(report.reportId) ?? [] })), page, pageSize: take, total, pages: Math.ceil(total / take) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin-reports] query failed", error);
    return NextResponse.json({ error: "Complaint data is unavailable. Please retry." }, { status: 503 });
  }
}

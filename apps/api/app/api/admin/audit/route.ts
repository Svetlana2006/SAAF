import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";
import { buildAdminAuditCsv } from "@saaf/platform/admin-policy";

const querySchema = z.object({ q: z.string().trim().max(160).optional(), recordType: z.string().trim().max(40).optional(), page: z.coerce.number().int().min(1).default(1), format: z.enum(["json", "csv"]).default("json") });
export async function GET(request: NextRequest) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const filters = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!filters.success) return NextResponse.json({ error: "Invalid audit filters." }, { status: 400 });
  const { q, recordType, page, format } = filters.data;
  const where = {
    ...(recordType ? { recordType } : {}),
    ...(q ? { OR: [
      { actionType: { contains: q, mode: "insensitive" as const } },
      { recordType: { contains: q, mode: "insensitive" as const } },
      { recordId: { contains: q, mode: "insensitive" as const } },
      { actorUserId: { contains: q, mode: "insensitive" as const } },
      { note: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
  };
  try {
    const take = format === "csv" ? 5000 : 100;
    const skip = format === "csv" ? 0 : (page - 1) * take;
    const [events, total] = await Promise.all([
      prisma.adminAuditEvent.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.adminAuditEvent.count({ where }),
    ]);
    if (format === "csv") {
      const body = buildAdminAuditCsv(events);
      return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=saaf-admin-audit.csv", "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ events, page, pageSize: take, total, pages: Math.ceil(total / take) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin-audit] query failed", error);
    return NextResponse.json({ error: "Administrative audit history is unavailable." }, { status: 503 });
  }
}

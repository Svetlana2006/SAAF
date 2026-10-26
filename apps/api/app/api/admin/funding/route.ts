import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

const querySchema = z.object({ q: z.string().trim().max(160).optional(), status: z.string().trim().max(40).optional(), page: z.coerce.number().int().min(1).default(1) });

export async function GET(request: NextRequest) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const filters = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!filters.success) return NextResponse.json({ error: "Invalid funding filters." }, { status: 400 });
  const { q, status, page } = filters.data;
  const where = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [
      { organization: { name: { contains: q, mode: "insensitive" as const } } },
      { mission: { missionId: { contains: q, mode: "insensitive" as const } } },
      { mission: { missionType: { contains: q, mode: "insensitive" as const } } },
      { mission: { ngo: { name: { contains: q, mode: "insensitive" as const } } } },
      { mission: { location: { nameArea: { contains: q, mode: "insensitive" as const } } } },
    ] } : {}),
  };
  try {
    const take = 50;
    const [grants, total, totals, organizations, legacyFunding, legacyTotal] = await Promise.all([
      prisma.csrGrant.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take,
        select: {
          grantId: true, amount: true, status: true, notes: true, authorizedBy: true, createdAt: true, updatedAt: true,
          organization: { select: { csrOrganizationId: true, name: true, email: true, approvedFundingBudget: true } },
          mission: { select: { missionId: true, missionType: true, status: true, estimatedCost: true, actualCost: true, ngo: { select: { ngoId: true, name: true } }, location: { select: { nameArea: true, wardZone: true } }, report: { select: { category: true, status: true } }, impactReports: { select: { impactId: true, status: true, createdAt: true } } } },
        },
      }),
      prisma.csrGrant.count({ where }),
      prisma.csrGrant.groupBy({ by: ["status"], _sum: { amount: true }, _count: { _all: true } }),
      prisma.csrOrganization.findMany({ orderBy: { name: "asc" }, select: { csrOrganizationId: true, name: true, email: true, approvedFundingBudget: true } }),
      prisma.funding.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { fundingId: true, amount: true, fundingSource: true, utilizationStatus: true, receivedDate: true, createdAt: true, mission: { select: { missionId: true, missionType: true, status: true } }, ngo: { select: { ngoId: true, name: true } } } }),
      prisma.funding.count(),
    ]);
    return NextResponse.json({
      grants, page, pageSize: take, total, pages: Math.ceil(total / take),
      totals: Object.fromEntries(totals.map(item => [item.status, { amount: item._sum.amount ?? 0, count: item._count._all }])),
      organizations, legacyFunding, legacyFundingTotal: legacyTotal,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin-funding] query failed", error);
    return NextResponse.json({ error: "Funding records are unavailable. Please retry." }, { status: 503 });
  }
}

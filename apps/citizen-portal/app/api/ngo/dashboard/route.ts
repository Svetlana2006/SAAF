import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@/lib/ngo-auth";

export async function GET() {
  const principal = await requireNgoPrincipal();
  if (isNgoResponse(principal)) return principal;
  const ngoId = principal.ngo.ngoId;
  const [missions, openOffers, volunteers, funding, claims, recentMissions] = await Promise.all([
    prisma.mission.count({ where: { ngoId, isActive: true } }),
    prisma.ngoReportOffer.count({ where: { ngoId, status: "offered" } }),
    prisma.missionVolunteer.count({ where: { mission: { ngoId }, status: { not: "withdrawn" } } }),
    prisma.funding.aggregate({ where: { ngoId }, _sum: { amount: true } }),
    prisma.ngoCostClaim.aggregate({ where: { ngoId }, _sum: { amount: true }, _count: { claimId: true } }),
    prisma.mission.findMany({ where: { ngoId }, orderBy: { createdAt: "desc" }, take: 8, include: { location: true, missionVolunteers: true, report: true } }),
  ]);
  return NextResponse.json({ metrics: { activeMissions: missions, openOpportunities: openOffers, assignedVolunteers: volunteers, fundingReceived: funding._sum.amount ?? 0, claimsSubmitted: claims._count.claimId, claimsTotal: claims._sum.amount ?? 0 }, missions: recentMissions });
}

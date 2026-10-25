import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@saaf/platform/prisma";
import { requireCsrPrincipal, isCsrResponse } from "@saaf/platform/csr-auth";
import { allocationWithinMissionBudget, missionCanReceiveCsrCommitment, missionStatusAllowsCsrCommitment } from "@saaf/platform/csr-policy";
import { CsrGrantInputSchema, isDuplicateCsrGrantError } from "@/lib/csr-input";

export async function GET() {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  try {
    const grants = await prisma.csrGrant.findMany({
      where: { csrOrganizationId: principal.organization.csrOrganizationId },
      orderBy: { createdAt: "desc" },
      include: { mission: { select: { missionId: true, missionType: true, status: true, estimatedCost: true, ngo: { select: { name: true } }, location: { select: { nameArea: true, wardZone: true } } } } },
    });
    return NextResponse.json({ grants });
  } catch (error) {
    console.error("[csr-grants] query failed", error);
    return NextResponse.json({ error: "Funding records are unavailable. Please retry." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = CsrGrantInputSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid mission and positive amount (up to two decimal places).", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const grant = await prisma.$transaction(async tx => {
      const organization = await tx.csrOrganization.findUnique({ where: { csrOrganizationId: principal.organization.csrOrganizationId }, select: { approvedFundingBudget: true } });
      if (!organization || organization.approvedFundingBudget == null || organization.approvedFundingBudget <= 0) throw new Error("CSR_BUDGET_UNAVAILABLE");
      const mission = await tx.mission.findUnique({ where: { missionId: parsed.data.missionId }, select: { missionId: true, status: true, isActive: true, estimatedCost: true } });
      if (!mission || !missionStatusAllowsCsrCommitment(mission)) throw new Error("MISSION_UNAVAILABLE");
      if (!missionCanReceiveCsrCommitment(mission)) throw new Error("MISSION_BUDGET_UNAVAILABLE");
      const proposedBudget = mission.estimatedCost;
      if (proposedBudget == null) throw new Error("MISSION_BUDGET_UNAVAILABLE");
      const organizationAllocation = await tx.csrGrant.aggregate({ where: { csrOrganizationId: principal.organization.csrOrganizationId, status: { in: ["committed", "released"] } }, _sum: { amount: true } });
      if (!allocationWithinMissionBudget(parsed.data.amount, organization.approvedFundingBudget, organizationAllocation._sum.amount ?? 0)) throw new Error("INSUFFICIENT_CSR_BUDGET");
      const usedBudget = await tx.csrGrant.aggregate({ where: { missionId: mission.missionId, status: { in: ["committed", "released"] } }, _sum: { amount: true } });
      if (!allocationWithinMissionBudget(parsed.data.amount, proposedBudget, usedBudget._sum.amount ?? 0)) throw new Error("INSUFFICIENT_MISSION_BUDGET");
      return tx.csrGrant.create({
        data: { csrOrganizationId: principal.organization.csrOrganizationId, missionId: mission.missionId, amount: parsed.data.amount, notes: parsed.data.notes || null, authorizedBy: principal.user.id },
        include: { mission: { select: { missionId: true, missionType: true, status: true } } },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ grant }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "MISSION_UNAVAILABLE") return NextResponse.json({ error: "This mission is unavailable for a CSR commitment." }, { status: 404 });
    if (error instanceof Error && error.message === "MISSION_BUDGET_UNAVAILABLE") return NextResponse.json({ error: "A proposed mission budget is not recorded, so funding cannot be allocated safely." }, { status: 409 });
    if (error instanceof Error && error.message === "CSR_BUDGET_UNAVAILABLE") return NextResponse.json({ error: "Your organization does not have an approved commitment budget. Contact the SAAF administrator." }, { status: 409 });
    if (error instanceof Error && error.message === "INSUFFICIENT_CSR_BUDGET") return NextResponse.json({ error: "The amount exceeds your organization's remaining approved commitment budget." }, { status: 409 });
    if (error instanceof Error && error.message === "INSUFFICIENT_MISSION_BUDGET") return NextResponse.json({ error: "The amount exceeds the remaining proposed mission budget." }, { status: 409 });
    if (isDuplicateCsrGrantError(error)) return NextResponse.json({ error: "Your organization has already committed support for this mission." }, { status: 409 });
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") return NextResponse.json({ error: "The mission budget changed during this request. Refresh the mission and retry." }, { status: 409 });
    console.error("[csr-grant] commitment write failed", error);
    return NextResponse.json({ error: "Could not record the commitment. Please retry." }, { status: 500 });
  }
}

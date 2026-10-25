import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

const bodySchema = z.object({ approvedFundingBudget: z.number().positive().max(100_000_000).refine(value => Math.abs(Math.round(value * 100) - value * 100) < 1e-8) });

export async function PATCH(request: NextRequest, context: { params: Promise<{ organizationId: string }> }) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const { organizationId } = await context.params;
  if (!organizationId || organizationId.length > 100) return NextResponse.json({ error: "Invalid CSR organization identifier." }, { status: 400 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Enter a positive budget amount with no more than two decimal places." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async tx => {
      const current = await tx.csrOrganization.findUnique({ where: { csrOrganizationId: organizationId }, select: { approvedFundingBudget: true } });
      if (!current) return null;
      const updated = await tx.csrOrganization.update({ where: { csrOrganizationId: organizationId }, data: { approvedFundingBudget: parsed.data.approvedFundingBudget } });
      await tx.adminAuditEvent.create({ data: {
        actorUserId: principal.user.id, actionType: "csr_organization.budget_changed", recordType: "csr_organization", recordId: organizationId,
        previousValue: { approvedFundingBudget: current.approvedFundingBudget }, newValue: { approvedFundingBudget: updated.approvedFundingBudget },
      } });
      return updated;
    });
    if (!result) return NextResponse.json({ error: "CSR organization not found." }, { status: 404 });
    return NextResponse.json({ approvedFundingBudget: parsed.data.approvedFundingBudget });
  } catch (error) {
    console.error("[admin-csr-budget] update failed", error);
    return NextResponse.json({ error: "Could not update the approved CSR budget." }, { status: 503 });
  }
}

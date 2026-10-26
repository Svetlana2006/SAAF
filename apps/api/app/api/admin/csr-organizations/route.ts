import { NextResponse } from "next/server";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

export async function GET() {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  try {
    const organizations = await prisma.csrOrganization.findMany({
      orderBy: { name: "asc" },
      select: { csrOrganizationId: true, name: true, email: true, approvedFundingBudget: true, grants: { where: { status: { in: ["committed", "released"] } }, select: { amount: true } } },
    });
    return NextResponse.json({ organizations: organizations.map(({ grants, ...organization }) => {
      const committedAmount = grants.reduce((sum, grant) => sum + grant.amount, 0);
      return {
        ...organization, committedAmount,
        availableFunding: organization.approvedFundingBudget == null ? null : Math.max(0, Math.round((organization.approvedFundingBudget - committedAmount) * 100) / 100),
        overAllocatedAmount: organization.approvedFundingBudget == null ? null : Math.max(0, Math.round((committedAmount - organization.approvedFundingBudget) * 100) / 100),
      };
    }) });
  } catch (error) {
    console.error("[admin-csr-budget] query failed", error);
    return NextResponse.json({ error: "CSR organization budgets are unavailable." }, { status: 503 });
  }
}

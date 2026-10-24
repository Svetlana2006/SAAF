import { prisma } from "@saaf/platform/prisma";
import { ok, withErrorHandling } from "@saaf/platform/api-helpers";

export async function GET() {
  return withErrorHandling(async () => {
    const [totalReports, completedReports, openReports, assignedReports, activeMissions, funding, confirmations, cleanConfirmations, severityGroups, categoryGroups, latestReports] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: "completed" } }),
      prisma.report.count({ where: { status: "open" } }),
      prisma.report.count({ where: { status: "assigned" } }),
      prisma.mission.count({ where: { isActive: true } }),
      prisma.funding.aggregate({ _sum: { amount: true } }),
      prisma.citizenConfirmation.count(),
      prisma.citizenConfirmation.count({ where: { status: "clean" } }),
      prisma.report.groupBy({ by: ["severity"], _count: { _all: true } }),
      prisma.report.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          reportId: true,
          category: true,
          severity: true,
          status: true,
          createdAt: true,
          location: {
            select: { nameArea: true },
          },
        },
      }),
    ]);

    const urgentReports = severityGroups
      .filter(({ severity }) => /critical|urgent|hazard/i.test(severity))
      .reduce((sum, group) => sum + group._count._all, 0);
    const drainReports = categoryGroups
      .filter(({ category }) => /drain|silt/i.test(category))
      .reduce((sum, group) => sum + group._count._all, 0);

    return ok({
      totalReports,
      completedReports,
      openReports,
      assignedReports,
      activeMissions,
      urgentReports,
      drainReports,
      fundingTotal: funding._sum.amount ?? 0,
      citizenApprovalRate:
        confirmations > 0 ? Math.round((cleanConfirmations / confirmations) * 1000) / 10 : null,
      latestReports,
    });
  });
}

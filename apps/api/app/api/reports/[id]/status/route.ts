/**
 * PATCH /api/reports/[id]/status
 * Update the status of a report (open → assigned → completed).
 *
 * Body: { status: "open" | "assigned" | "completed" }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { ok, notFound, withErrorHandling } from "@saaf/platform/api-helpers";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";
import { canTransitionReportStatus } from "@saaf/platform/admin-policy";

const PatchSchema = z.object({
  status: z.enum(["open", "assigned", "completed"], {
    errorMap: () => ({ message: "status must be one of: open, assigned, completed" }),
  }),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  return withErrorHandling(async () => {
    const { id } = await params;
    if (!/^c[a-z0-9]{8,}$/i.test(id)) return notFound("Report not found.");
    const body = PatchSchema.parse(await req.json());

    const existing = await prisma.report.findFirst({ where: { reportId: id }, include: { missions: { select: { missionId: true, status: true } } } });
    if (!existing) return notFound(`Report '${id}' not found.`);
    if (existing.status === body.status) return NextResponse.json({ error: "The report already has that status." }, { status: 409 });
    if (!canTransitionReportStatus({ from: existing.status, to: body.status, hasMission: existing.missions.length > 0, hasCompletedMission: existing.missions.some(mission => mission.status === "completed") })) {
      return NextResponse.json({ error: "That report status transition is not valid for its current mission state." }, { status: 409 });
    }

    let updated;
    try {
      updated = await prisma.$transaction(async tx => {
        const changed = await tx.report.updateMany({ where: { reportId: id, status: existing.status }, data: { status: body.status } });
        if (!changed.count) throw new Error("REPORT_ALREADY_CHANGED");
        const report = await tx.report.findUniqueOrThrow({ where: { reportId: id }, select: { reportId: true, status: true, category: true, createdAt: true } });
        await tx.adminAuditEvent.create({ data: {
          actorUserId: principal.user.id, actionType: "report.status_changed", recordType: "report", recordId: id,
          previousValue: { status: existing.status }, newValue: { status: body.status },
        } });
        return report;
      });
    } catch (error) {
      if (error instanceof Error && error.message === "REPORT_ALREADY_CHANGED") return NextResponse.json({ error: "This report changed while you were reviewing it. Reload and retry." }, { status: 409 });
      throw error;
    }

    return ok({
      reportId: updated.reportId,
      status: updated.status,
      category: updated.category,
      updatedAt: new Date().toISOString(),
    });
  });
}

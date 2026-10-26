import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";
import { canCompleteMission } from "@saaf/platform/admin-policy";

const completeSchema = z.object({ note: z.string().trim().max(1000).optional() });

export async function POST(request: NextRequest, context: { params: Promise<{ missionId: string }> }) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const { missionId } = await context.params;
  if (!missionId || missionId.length > 100) return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  const parsed = completeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid completion note." }, { status: 400 });
  try {
    const mission = await prisma.mission.findUnique({ where: { missionId }, select: { missionId: true, status: true, reportId: true } });
    if (!mission) return NextResponse.json({ error: "Mission not found." }, { status: 404 });
    if (mission.status !== "review_pending") return NextResponse.json({ error: "Only missions awaiting human review can be completed." }, { status: 409 });
    const afterEvidence = await prisma.evidence.findMany({ where: { missionId, type: "after" }, select: { verificationStatus: true } });
    if (!canCompleteMission(mission.status, afterEvidence.map(item => item.verificationStatus))) {
      return NextResponse.json({ error: "Approve at least one after photo and resolve every pending or rejected after photo before completing this mission." }, { status: 409 });
    }
    const now = new Date();
    await prisma.$transaction(async tx => {
      const changed = await tx.mission.updateMany({ where: { missionId, status: "review_pending" }, data: { status: "completed", isActive: false } });
      if (!changed.count) throw new Error("MISSION_ALREADY_CHANGED");
      await tx.missionStatusEvent.create({ data: { missionId, fromStatus: "review_pending", toStatus: "completed", note: parsed.data.note || "Completion approved by an administrator." } });
      await tx.adminAuditEvent.create({ data: {
        actorUserId: principal.user.id, actionType: "mission.completed", recordType: "mission", recordId: missionId,
        previousValue: { status: "review_pending" }, newValue: { status: "completed" }, note: parsed.data.note ?? null,
      } });
      if (mission.reportId) {
        const report = await tx.report.findUnique({ where: { reportId: mission.reportId }, select: { status: true } });
        if (report?.status === "assigned") {
          await tx.report.updateMany({ where: { reportId: mission.reportId, status: "assigned" }, data: { status: "completed" } });
          await tx.adminAuditEvent.create({ data: {
            actorUserId: principal.user.id, actionType: "report.completed_by_mission_review", recordType: "report", recordId: mission.reportId,
            previousValue: { status: report.status }, newValue: { status: "completed" }, note: parsed.data.note ?? null,
          } });
        }
      }
    });
    return NextResponse.json({ missionId, status: "completed", completedAt: now.toISOString() });
  } catch (error) {
    if (error instanceof Error && error.message === "MISSION_ALREADY_CHANGED") return NextResponse.json({ error: "This mission changed while it was being reviewed. Reload and retry." }, { status: 409 });
    console.error("[admin-mission-completion] update failed", error);
    return NextResponse.json({ error: "Could not save mission completion." }, { status: 503 });
  }
}

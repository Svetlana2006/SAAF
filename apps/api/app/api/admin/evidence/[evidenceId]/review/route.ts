import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

const decisionSchema = z.object({ decision: z.enum(["approve", "reject"]), reason: z.string().trim().max(1000).optional() }).superRefine((value, context) => {
  if (value.decision === "reject" && !value.reason) context.addIssue({ code: "custom", path: ["reason"], message: "A rejection reason is required." });
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ evidenceId: string }> }) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const { evidenceId } = await context.params;
  if (!evidenceId || evidenceId.length > 100) return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid evidence decision." }, { status: 400 });
  try {
    const evidence = await prisma.evidence.findUnique({ where: { evidenceId }, select: { evidenceId: true, type: true, verificationStatus: true, verified: true, missionId: true } });
    if (!evidence) return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
    if (evidence.verificationStatus !== "pending") return NextResponse.json({ error: "This evidence already has a review decision." }, { status: 409 });
    const status = parsed.data.decision === "approve" ? "approved" : "rejected";
    const reviewedAt = new Date();
    const updated = await prisma.$transaction(async tx => {
      const changed = await tx.evidence.updateMany({ where: { evidenceId, verificationStatus: "pending" }, data: {
        verificationStatus: status,
        verified: parsed.data.decision === "approve",
        verifiedBy: parsed.data.decision === "approve" ? principal.user.id : null,
        reviewedBy: principal.user.id,
        reviewedAt,
        reviewReason: parsed.data.reason ?? null,
      } });
      if (!changed.count) throw new Error("EVIDENCE_ALREADY_REVIEWED");
      const current = await tx.evidence.findUniqueOrThrow({ where: { evidenceId }, select: { evidenceId: true, verificationStatus: true, reviewedAt: true, reviewedBy: true, reviewReason: true } });
      await tx.adminAuditEvent.create({ data: {
        actorUserId: principal.user.id, actionType: `evidence.${status}`, recordType: "evidence", recordId: evidenceId,
        previousValue: { verificationStatus: evidence.verificationStatus, verified: evidence.verified },
        newValue: { verificationStatus: status, reason: parsed.data.reason ?? null }, note: parsed.data.reason ?? null,
      } });
      return current;
    });
    return NextResponse.json({ evidence: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "EVIDENCE_ALREADY_REVIEWED") return NextResponse.json({ error: "This evidence already has a review decision." }, { status: 409 });
    console.error("[admin-evidence-review] update failed", error);
    return NextResponse.json({ error: "Could not save the evidence review." }, { status: 503 });
  }
}

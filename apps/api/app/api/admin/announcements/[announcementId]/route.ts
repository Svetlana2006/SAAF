import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

const updateSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  message: z.string().trim().min(1).max(5000).optional(),
  audience: z.enum(["all", "citizen", "ngo", "csr"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
}).refine(value => Object.keys(value).length > 0, "Provide a field to update.");

export async function PATCH(request: NextRequest, context: { params: Promise<{ announcementId: string }> }) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const { announcementId } = await context.params;
  if (!announcementId || announcementId.length > 100) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid announcement update." }, { status: 400 });
  try {
    const existing = await prisma.announcement.findUnique({ where: { announcementId } });
    if (!existing) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
    if (existing.status === "archived") return NextResponse.json({ error: "Archived announcements cannot be changed." }, { status: 409 });
    const status = parsed.data.status ?? existing.status;
    const publishedAt = status === "published" ? existing.publishedAt ?? new Date() : null;
    const updated = await prisma.$transaction(async tx => {
      const changed = await tx.announcement.updateMany({ where: { announcementId, status: existing.status }, data: { ...parsed.data, status, publishedAt, updatedBy: principal.user.id } });
      if (!changed.count) throw new Error("ANNOUNCEMENT_ALREADY_CHANGED");
      const record = await tx.announcement.findUniqueOrThrow({ where: { announcementId } });
      await tx.adminAuditEvent.create({ data: {
        actorUserId: principal.user.id, actionType: `announcement.${status}`, recordType: "announcement", recordId: announcementId,
        previousValue: { title: existing.title, message: existing.message, audience: existing.audience, status: existing.status },
        newValue: { title: record.title, message: record.message, audience: record.audience, status: record.status },
      } });
      return record;
    });
    return NextResponse.json({ announcement: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "ANNOUNCEMENT_ALREADY_CHANGED") return NextResponse.json({ error: "This announcement changed while you were editing it. Reload and retry." }, { status: 409 });
    console.error("[admin-announcements] update failed", error);
    return NextResponse.json({ error: "Could not update the announcement." }, { status: 503 });
  }
}

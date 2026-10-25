import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

const createSchema = z.object({ title: z.string().trim().min(3).max(160), message: z.string().trim().min(1).max(5000), audience: z.enum(["all", "citizen", "ngo", "csr"]), status: z.enum(["draft", "published"]).default("draft") });
const querySchema = z.object({ status: z.enum(["all", "draft", "published", "archived"]).default("all"), audience: z.enum(["all", "citizen", "ngo", "csr"]).optional(), page: z.coerce.number().int().min(1).default(1) });

export async function GET(request: NextRequest) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid announcement filters." }, { status: 400 });
  const { status, audience, page } = parsed.data;
  const where = { ...(status !== "all" ? { status } : {}), ...(audience ? { audience } : {}) };
  try {
    const take = 50;
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * take, take }),
      prisma.announcement.count({ where }),
    ]);
    return NextResponse.json({ announcements, page, pageSize: take, total, pages: Math.ceil(total / take) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin-announcements] query failed", error);
    return NextResponse.json({ error: "Announcements are unavailable. Apply the Admin portal migration and retry." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid announcement." }, { status: 400 });
  try {
    const now = new Date();
    const announcement = await prisma.$transaction(async tx => {
      const created = await tx.announcement.create({ data: {
        ...parsed.data, createdBy: principal.user.id, updatedBy: principal.user.id,
        publishedAt: parsed.data.status === "published" ? now : null,
      } });
      await tx.adminAuditEvent.create({ data: {
        actorUserId: principal.user.id, actionType: `announcement.${parsed.data.status}`, recordType: "announcement", recordId: created.announcementId,
        newValue: { title: created.title, message: created.message, audience: created.audience, status: created.status },
      } });
      return created;
    });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("[admin-announcements] create failed", error);
    return NextResponse.json({ error: "Could not create the announcement." }, { status: 503 });
  }
}

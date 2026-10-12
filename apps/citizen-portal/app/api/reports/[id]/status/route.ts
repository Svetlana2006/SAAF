/**
 * PATCH /api/reports/[id]/status
 * Update the status of a report (open → assigned → completed).
 *
 * Body: { status: "open" | "assigned" | "completed" }
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, withErrorHandling } from "@/lib/api-helpers";

const PatchSchema = z.object({
  status: z.enum(["open", "assigned", "completed"], {
    errorMap: () => ({ message: "status must be one of: open, assigned, completed" }),
  }),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = PatchSchema.parse(await req.json());

    const existing = await prisma.report.findFirst({ where: { reportId: id } });
    if (!existing) return notFound(`Report '${id}' not found.`);

    const updated = await prisma.report.update({
      where: { reportId: id },
      data: { status: body.status },
      select: { reportId: true, status: true, category: true, createdAt: true },
    });

    // If completed, check if the location should be un-flagged as hotspot
    // (simple heuristic: if all recent reports at that location are resolved)
    if (body.status === "completed" && existing.locationId) {
      const openCount = await prisma.report.count({
        where: {
          locationId: existing.locationId,
          status: { not: "completed" },
        },
      });
      if (openCount === 0) {
        await prisma.location.update({
          where: { locationId: existing.locationId },
          data: { isHotspot: false },
        });
      }
    }

    return ok({
      reportId: updated.reportId,
      status: updated.status,
      category: updated.category,
      updatedAt: new Date().toISOString(),
    });
  });
}

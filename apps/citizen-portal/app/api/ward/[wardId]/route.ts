/**
 * GET /api/ward/[wardId]
 * Returns live stats for a Location by its wardZone or locationId.
 * wardId can be a locationId (cuid) or a wardZone name slug.
 *
 * Example: GET /api/ward/cma12345...  (locationId)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, withErrorHandling } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ wardId: string }> }
) {
  return withErrorHandling(async () => {
    const { wardId } = await params;

    // Try to find by locationId first, then by wardZone
    const location = await prisma.location.findFirst({
      where: { OR: [{ locationId: wardId }, { wardZone: { contains: wardId } }] },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          include: {
            citizen: { select: { name: true, isAnonymous: true } },
          },
        },
        missions: {
          where: { isActive: true },
          include: { ngo: { select: { name: true } } },
        },
        hotspots: {
          where: { status: "active" },
          include: { rootCauses: true },
        },
      },
    });

    if (!location) return notFound(`Location '${wardId}' not found.`);

    const reports = location.reports;
    const totalReports = reports.length;
    const completed = reports.filter((r) => r.status === "completed");
    const open = reports.filter((r) => r.status === "open");
    const assigned = reports.filter((r) => r.status === "assigned");

    return ok({
      location: {
        locationId: location.locationId,
        nameArea: location.nameArea,
        address: location.address,
        wardZone: location.wardZone,
        areaType: location.areaType,
        isHotspot: location.isHotspot,
        latitude: location.latitude,
        longitude: location.longitude,
      },
      kpis: {
        totalReports,
        completedReports: completed.length,
        openReports: open.length,
        assignedReports: assigned.length,
        resolutionRate:
          totalReports > 0
            ? Math.round((completed.length / totalReports) * 1000) / 10
            : null,
        activeMissions: location.missions.length,
        activeHotspots: location.hotspots.length,
      },
      activeMissions: location.missions.map((m: any) => ({
        missionId: m.missionId,
        missionType: m.missionType,
        priority: m.priority,
        status: m.status,
        scheduledDate: m.scheduledDate,
        ngoName: m.ngo?.name ?? m.leadNgo,
        spotsLeft: Math.max(0, m.totalSlots - m.filledSlots),
      })),
      activeHotspots: location.hotspots.map((h: any) => ({
        hotspotId: h.hotspotId,
        recurrenceCount: h.recurrenceCount,
        lastCleanedDate: h.lastCleanedDate,
        rootCauses: h.rootCauses.map((rc: any) => ({
          causeType: rc.causeType,
          description: rc.description,
        })),
      })),
      recentReports: reports.slice(0, 5).map((r: any) => ({
        reportId: r.reportId,
        category: r.category,
        severity: r.severity,
        status: r.status,
        citizenName: r.citizen?.isAnonymous ? null : r.citizen?.name ?? null,
        createdAt: r.createdAt,
      })),
    });
  });
}

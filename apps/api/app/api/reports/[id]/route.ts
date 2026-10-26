/**
 * GET /api/reports/[id] — fetch a single report for Admin review without citizen PII.
 */
import { NextRequest } from "next/server";
import { prisma } from "@saaf/platform/prisma";
import { ok, notFound, withErrorHandling } from "@saaf/platform/api-helpers";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  return withErrorHandling(async () => {
    const { id } = await params;
    if (!/^c[a-z0-9]{8,}$/i.test(id)) return notFound("Report not found.");

    const report = await prisma.report.findFirst({
      where: { reportId: id },
      include: {
        location: true,
        images: { select: { imageId: true, photoUrl: true, cloudinaryId: true, purpose: true, uploadedAt: true } },
        missions: { select: { missionId: true, status: true, scheduledDate: true, ngo: { select: { name: true } } } },
        ngoOffers: { select: { offerId: true, status: true, offeredAt: true, respondedAt: true, ngo: { select: { name: true } } } },
        citizenConfirmations: { select: { status: true, comment: true, photoUrl: true, createdAt: true } },
      },
    });

    if (!report) return notFound(`Report '${id}' not found.`);

    return ok({
      reportId: report.reportId,
      category: report.category,
      severity: report.severity,
      description: report.description,
      status: report.status,
      photoUrl: report.photoUrl,
      images: report.images,
      isAnonymous: report.isAnonymous,
      citizen: null,
      missions: report.missions,
      ngoOffers: report.ngoOffers,
      citizenFeedback: report.citizenConfirmations.map(({ status, comment, photoUrl, createdAt }) => ({ status, comment, photoUrl, createdAt })),
      location: report.location
        ? {
            nameArea: report.location.nameArea,
            address: report.location.address,
            wardZone: report.location.wardZone,
            areaType: report.location.areaType,
            isHotspot: report.location.isHotspot,
            latitude: report.location.latitude,
            longitude: report.location.longitude,
          }
        : null,
      createdAt: report.createdAt,
    });
  });
}

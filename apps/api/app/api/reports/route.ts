/**
 * POST /api/reports
 * Submit a new sanitation report with photo evidence.
 *
 * Request: multipart/form-data
 *   photos[]     — 3+ image files (uploaded to Cloudinary as Evidence)
 *   category     — string
 *   severity     — string
 *   description  — string (max 500)
 *   latitude     — number string
 *   longitude    — number string
 *   address      — string
 *
 * Response 201: { success, data: { reportId, locationArea, wardZone } }
 * Response 400: { success: false, error }
 *
 * GET /api/reports?zone=Central&status=open&page=1&limit=20
 * Response 200: { success, data: { reports[], pagination } }
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { uploadToCloudinary } from "@saaf/platform/cloudinary";
import { resolveLocation } from "@saaf/platform/location-resolver";
import { created, ok, badRequest, withErrorHandling } from "@saaf/platform/api-helpers";
import { rateLimit } from "@saaf/platform/rate-limit";
import { isAllowedImage } from "@saaf/platform/image-validation";
import { PublicReportBodySchema } from "../../../lib/public-input";
import { resolveOptionalCitizenSession } from "@saaf/platform/citizen-auth";
import { isValidReportPhotoCount, reportImageCreateData } from "@saaf/platform/workflow-policy";
const maxFileBytes = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "report-submit", 5, 60 * 60 * 1000);
  if (limited) return limited;
  return withErrorHandling(async () => {
    // ── Parse multipart form data ─────────────────────────────────────────
    const formData = await req.formData();
    const photos = formData.getAll("photos") as File[];

    if (!isValidReportPhotoCount(photos.length)) {
      return badRequest("Provide between 3 and 5 photos.");
    }
    for (const file of photos) {
      if (!(file instanceof File) || file.size > maxFileBytes || !(await isAllowedImage(file))) {
        return badRequest("Each photo must be a non-empty JPEG, PNG, or WebP image no larger than 8 MB.");
      }
    }

    // ── Validate text fields ──────────────────────────────────────────────
    const rawBody: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") rawBody[key] = value;
    }
    const body = PublicReportBodySchema.parse(rawBody);
    const citizenSession = await resolveOptionalCitizenSession(req);
    if (citizenSession.response) return citizenSession.response;
    const citizen = citizenSession.citizen;

    // ── Resolve nearest Location from GPS ─────────────────────────────────
    const locationInfo = await resolveLocation(body.latitude, body.longitude);

    // ── Create report without an authenticated citizen identity ─────────────────────────────────────
    // This endpoint accepts public anonymous reports. Never trust identity fields from a browser.

    // ── Upload photos to Cloudinary as Evidence records ───────────────────
    // Photos uploaded BEFORE mission assignment — stage = BEFORE
    const evidenceUploads = await Promise.all(
      photos.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await uploadToCloudinary(buffer, file.name, "saaf/reports");
        return { photoUrl: uploaded.url, cloudinaryId: uploaded.cloudinaryId, purpose: "report" };
      })
    );

    // ── Create Report then re-fetch with includes ─────────────────────────
    const createdReport = await prisma.report.create({
      data: {
        citizenId: citizen && !body.isAnonymous ? citizen.citizenId : undefined,
        locationId: locationInfo?.locationId ?? undefined,
        category: body.category,
        severity: body.severity,
        description: body.description,
        photoUrl: evidenceUploads[0]?.photoUrl ?? null,
        status: "open",
        isAnonymous: !citizen || body.isAnonymous,
        images: { create: reportImageCreateData(evidenceUploads) },
      },
    });

    // Route every new open case to the best matching partners. If no expertise
    // term matches the citizen category, offer it to all registered NGOs so
    // unusual reports are still visible for manual triage.
    const ngos = await prisma.ngo.findMany({ select: { ngoId: true, expertiseAreas: true } });
    const termsByCategory: Record<string, string[]> = {
      drain: ["desilting", "drainage"],
      plastic: ["plastic_recovery", "waste_segregation"],
      garbage: ["waste_segregation", "plastic_recovery"],
      waste: ["waste_segregation", "plastic_recovery"],
      rubble: ["rubble_clearance"],
      awareness: ["awareness_campaigns"],
    };
    const categoryKey = body.category.toLowerCase();
    const matchedTerms = Object.entries(termsByCategory).filter(([term]) => categoryKey.includes(term)).flatMap(([, terms]) => terms);
    const matchedNgos = ngos.filter(ngo => ngo.expertiseAreas.some(area => matchedTerms.includes(area.toLowerCase())));
    const recipients = matchedNgos.length ? matchedNgos : ngos;
    if (recipients.length) await prisma.ngoReportOffer.createMany({ data: recipients.map(ngo => ({ reportId: createdReport.reportId, ngoId: ngo.ngoId })), skipDuplicates: true });

    // Re-fetch with relations for the response
    const result = await prisma.report.findFirst({
      where: { reportId: createdReport.reportId },
      include: { location: { select: { nameArea: true, wardZone: true } }, images: { select: { imageId: true, photoUrl: true, purpose: true, uploadedAt: true } } },
    });


    return created({
      reportId: result?.reportId ?? createdReport.reportId,
      category: result?.category ?? body.category,
      severity: result?.severity ?? body.severity,
      status: result?.status ?? "open",
      locationArea: result?.location?.nameArea ?? body.address,
      wardZone: result?.location?.wardZone ?? "Unknown Zone",
      primaryPhotoUrl: evidenceUploads[0]?.photoUrl ?? null,
      totalPhotos: evidenceUploads.length,
      images: result?.images ?? [],
    });
  });
}

// ── GET /api/reports ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const zoneValue = searchParams.get("zone");
    const statusValue = searchParams.get("status");
    const zone = zoneValue === null ? undefined : z.string().trim().min(1).max(80).safeParse(zoneValue);
    const status = statusValue === null ? undefined : z.enum(["open", "assigned", "completed"]).safeParse(statusValue);
    if (zone && !zone.success) return badRequest("Invalid zone parameter.");
    if (status && !status.success) return badRequest("Invalid status parameter.");
    const page = z.coerce.number().int().min(1).max(10000).safeParse(searchParams.get("page") ?? "1");
    const limit = z.coerce.number().int().min(1).max(50).safeParse(searchParams.get("limit") ?? "20");
    if (!page.success || !limit.success) return badRequest("page must be 1–10000 and limit must be 1–50.");
    const skip = (page.data - 1) * limit.data;

    const where = {
      ...(zone ? { location: { wardZone: zone.data } } : {}),
      ...(status ? { status: status.data } : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit.data,
        orderBy: { createdAt: "desc" },
        include: {
          location: { select: { nameArea: true, wardZone: true, areaType: true, isHotspot: true, latitude: true, longitude: true } },
          images: { select: { imageId: true, photoUrl: true, purpose: true, uploadedAt: true } },
          citizen: { select: { name: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return ok({
      reports: reports.map((r) => ({
        reportId: r.reportId,
        category: r.category,
        severity: r.severity,
        status: r.status,
        photoUrl: r.photoUrl,
        images: r.images,
        reporterName: !r.isAnonymous ? r.citizen?.name ?? null : null,
        isAnonymous: r.isAnonymous,
        location: r.location
          ? {
              nameArea: r.location.nameArea,
              wardZone: r.location.wardZone,
              areaType: r.location.areaType,
              isHotspot: r.location.isHotspot,
              // Coarse map point only; never return the report's exact coordinates publicly.
              latitude: Math.round(r.location.latitude * 100) / 100,
              longitude: Math.round(r.location.longitude * 100) / 100,
            }
          : null,
        createdAt: r.createdAt,
      })),
      pagination: { page: page.data, limit: limit.data, total, totalPages: Math.ceil(total / limit.data) },
    });
  });
}

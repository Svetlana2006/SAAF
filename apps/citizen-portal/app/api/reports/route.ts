/**
 * POST /api/reports
 * Submit a new sanitation report with photo evidence.
 *
 * Request: multipart/form-data
 *   photos[]     — 3+ image files (uploaded to Cloudinary as Evidence)
 *   category     — string
 *   severity     — string
 *   description  — string (max 500)
 *   isAnonymous  — "true" | "false"
 *   latitude     — number string
 *   longitude    — number string
 *   address      — string
 *   citizenName  (optional)
 *   citizenEmail (optional)
 *   citizenPhone (optional)
 *
 * Response 201: { success, data: { reportId, locationArea, wardZone } }
 * Response 400: { success: false, error }
 *
 * GET /api/reports?zone=Central&status=open&page=1&limit=20
 * Response 200: { success, data: { reports[], pagination } }
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { resolveLocation } from "@/lib/location-resolver";
import { created, ok, badRequest, withErrorHandling } from "@/lib/api-helpers";

const BodySchema = z.object({
  category: z.string().min(1, "Category is required"),
  severity: z.string().min(1, "Severity is required"),
  description: z.string().max(500).default(""),
  isAnonymous: z.string().transform((v) => v === "true").default("false"),
  latitude: z.string().transform((v) => parseFloat(v)),
  longitude: z.string().transform((v) => parseFloat(v)),
  address: z.string().min(1, "Address is required"),
  citizenName: z.string().optional(),
  citizenEmail: z.string().email().optional(),
  citizenPhone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    // ── Parse multipart form data ─────────────────────────────────────────
    const formData = await req.formData();
    const photos = formData.getAll("photos") as File[];

    if (!photos || photos.length < 3) {
      return badRequest("Minimum 3 photos required.");
    }
    for (const file of photos) {
      if (!file.type.startsWith("image/")) {
        return badRequest(`'${file.name}' is not a valid image file.`);
      }
    }

    // ── Validate text fields ──────────────────────────────────────────────
    const rawBody: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") rawBody[key] = value;
    }
    const body = BodySchema.parse(rawBody);

    // ── Resolve nearest Location from GPS ─────────────────────────────────
    const locationInfo = await resolveLocation(body.latitude, body.longitude);

    // ── Find or upsert Citizen record ─────────────────────────────────────
    let citizenRecord = null;
    if (!body.isAnonymous && body.citizenEmail) {
      citizenRecord = await prisma.citizen.upsert({
        where: { email: body.citizenEmail },
        update: {
          name: body.citizenName ?? "Anonymous",
          phone: body.citizenPhone ?? undefined,
        },
        create: {
          name: body.citizenName ?? "Anonymous",
          email: body.citizenEmail,
          phone: body.citizenPhone ?? undefined,
          role: "citizen",
          isAnonymous: false,
        },
      });
    }

    // ── Upload photos to Cloudinary as Evidence records ───────────────────
    // Photos uploaded BEFORE mission assignment — stage = BEFORE
    const evidenceUploads = await Promise.all(
      photos.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url } = await uploadToCloudinary(buffer, file.name, "saaf/reports");
        return { photoUrl: url, type: "before" as const };
      })
    );

    // ── Create Report then re-fetch with includes ─────────────────────────
    const createdReport = await prisma.report.create({
      data: {
        citizenId: citizenRecord?.citizenId ?? undefined,
        locationId: locationInfo?.locationId ?? undefined,
        category: body.category,
        severity: body.severity,
        description: body.description,
        photoUrl: evidenceUploads[0]?.photoUrl ?? null,
        status: "open",
      },
    });

    // Re-fetch with relations for the response
    const result = await prisma.report.findFirst({
      where: { reportId: createdReport.reportId },
      include: {
        location: { select: { nameArea: true, wardZone: true } },
        citizen: { select: { name: true } },
      },
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
    });
  });
}

// ── GET /api/reports ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const zone = searchParams.get("zone") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;

    const where = {
      ...(zone ? { location: { wardZone: zone } } : {}),
      ...(status ? { status } : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          citizen: { select: { name: true, isAnonymous: true } },
          location: { select: { nameArea: true, wardZone: true, areaType: true, isHotspot: true, latitude: true, longitude: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return ok({
      reports: reports.map((r: any) => ({
        reportId: r.reportId,
        category: r.category,
        severity: r.severity,
        description: r.description,
        status: r.status,
        photoUrl: r.photoUrl,
        citizenName: r.citizen?.isAnonymous ? null : r.citizen?.name ?? null,
        location: r.location
          ? {
              nameArea: r.location.nameArea,
              wardZone: r.location.wardZone,
              areaType: r.location.areaType,
              isHotspot: r.location.isHotspot,
              latitude: r.location.latitude,
              longitude: r.location.longitude,
            }
          : null,
        createdAt: r.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });
}

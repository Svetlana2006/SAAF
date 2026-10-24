import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@saaf/platform/ngo-auth";
import { uploadToCloudinary } from "@saaf/platform/cloudinary";
import { isAllowedImage } from "@saaf/platform/image-validation";

const maxFileBytes = 8 * 1024 * 1024;

export async function POST(request: NextRequest, context: { params: Promise<{ missionId: string }> }) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const { missionId } = await context.params;
  const mission = await prisma.mission.findFirst({ where: { missionId, ngoId: principal.ngo.ngoId }, include: { location: true } });
  if (!mission) return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  const form = await request.formData();
  const file = form.get("file"); const type = form.get("type");
  if (!(file instanceof File) || typeof type !== "string" || !["before", "after", "video"].includes(type)) return NextResponse.json({ error: "Provide a file and type (before, after, or video)." }, { status: 400 });
  if (file.size > maxFileBytes || !(await isAllowedImage(file))) return NextResponse.json({ error: "Evidence must be a valid JPEG, PNG, or WebP image smaller than 8 MB." }, { status: 400 });
  const coords = z.object({ lat: z.coerce.number().min(-90).max(90).optional(), lng: z.coerce.number().min(-180).max(180).optional() }).safeParse({ lat: form.get("lat"), lng: form.get("lng") });
  if (!coords.success) return NextResponse.json({ error: "Invalid evidence coordinates." }, { status: 400 });
  const uploaded = await uploadToCloudinary(Buffer.from(await file.arrayBuffer()), file.name, `saaf/ngo-evidence/${missionId}`);
  const evidence = await prisma.evidence.create({ data: { missionId, type, photoUrl: uploaded.url, cloudinaryId: uploaded.cloudinaryId, description: String(form.get("description") ?? "").slice(0, 500) || null, locationLat: coords.data.lat ?? mission.location.latitude, locationLong: coords.data.lng ?? mission.location.longitude } });
  return NextResponse.json({ evidence }, { status: 201 });
}

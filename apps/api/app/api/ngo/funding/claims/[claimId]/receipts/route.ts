import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saaf/platform/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@saaf/platform/ngo-auth";
import { uploadToCloudinary } from "@saaf/platform/cloudinary";
import { isAllowedImage } from "@saaf/platform/image-validation";

const maxFileBytes = 8 * 1024 * 1024;

export async function POST(request: NextRequest, context: { params: Promise<{ claimId: string }> }) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const { claimId } = await context.params;
  const claim = await prisma.ngoCostClaim.findFirst({ where: { claimId, ngoId: principal.ngo.ngoId }, include: { items: true } });
  if (!claim) return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  const form = await request.formData();
  const itemId = form.get("itemId"); const file = form.get("file");
  if (typeof itemId !== "string" || !(file instanceof File)) return NextResponse.json({ error: "Provide itemId and file." }, { status: 400 });
  if (!claim.items.some(item => item.itemId === itemId)) return NextResponse.json({ error: "Claim item not found." }, { status: 404 });
  if (file.size > maxFileBytes || !(await isAllowedImage(file))) return NextResponse.json({ error: "Receipt must be a valid JPEG, PNG, or WebP image smaller than 8 MB." }, { status: 400 });
  const uploaded = await uploadToCloudinary(Buffer.from(await file.arrayBuffer()), file.name, "saaf/ngo-receipts");
  const item = await prisma.ngoCostClaimItem.update({ where: { itemId }, data: { receiptUrl: uploaded.url, cloudinaryId: uploaded.cloudinaryId } });
  return NextResponse.json({ item }, { status: 201 });
}

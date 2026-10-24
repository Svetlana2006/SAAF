import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saaf/platform/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@saaf/platform/ngo-auth";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const principal = await requireNgoPrincipal();
  if (isNgoResponse(principal)) return principal;
  const parsedStatus = z.enum(["offered", "accepted", "declined", "closed"]).safeParse(request.nextUrl.searchParams.get("status") ?? "offered");
  if (!parsedStatus.success) return NextResponse.json({ error: "Invalid offer status." }, { status: 400 });
  const offers = await prisma.ngoReportOffer.findMany({ where: { ngoId: principal.ngo.ngoId, status: parsedStatus.data }, orderBy: { offeredAt: "desc" }, include: { report: { include: { location: true, images: { select: { imageId: true, photoUrl: true, purpose: true, uploadedAt: true } } } } } });
  return NextResponse.json({ offers });
}

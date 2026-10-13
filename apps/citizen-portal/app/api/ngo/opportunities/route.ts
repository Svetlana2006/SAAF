import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@/lib/ngo-auth";

export async function GET(request: NextRequest) {
  const principal = await requireNgoPrincipal();
  if (isNgoResponse(principal)) return principal;
  const status = request.nextUrl.searchParams.get("status") ?? "offered";
  const offers = await prisma.ngoReportOffer.findMany({ where: { ngoId: principal.ngo.ngoId, status }, orderBy: { offeredAt: "desc" }, include: { report: { include: { location: true } } } });
  return NextResponse.json({ offers });
}

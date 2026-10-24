import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saaf/platform/prisma";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^c[a-z0-9]{8,}$/i.test(id)) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const report = await prisma.report.findUnique({ where: { reportId: id }, include: { location: true, citizen: { select: { name: true } }, images: { select: { imageId: true, photoUrl: true, purpose: true, uploadedAt: true } } } });
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json({ report: { reportId: report.reportId, category: report.category, severity: report.severity, status: report.status, reporterName: report.isAnonymous ? null : report.citizen?.name ?? null, isAnonymous: report.isAnonymous, images: report.images.length ? report.images : report.photoUrl ? [{ imageId: "primary", photoUrl: report.photoUrl, purpose: "report", uploadedAt: report.createdAt }] : [], location: report.location ? { nameArea: report.location.nameArea, wardZone: report.location.wardZone, latitude: Math.round(report.location.latitude * 100) / 100, longitude: Math.round(report.location.longitude * 100) / 100 } : null, createdAt: report.createdAt } });
}

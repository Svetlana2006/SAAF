import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@/lib/ngo-auth";

export async function POST(request: NextRequest, context: { params: Promise<{ offerId: string }> }) {
  const principal = await requireNgoPrincipal();
  if (isNgoResponse(principal)) return principal;
  const { offerId } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("decision" in body) || !["accept", "decline"].includes(String(body.decision))) return NextResponse.json({ error: "decision must be accept or decline." }, { status: 400 });
  const offer = await prisma.ngoReportOffer.findFirst({ where: { offerId, ngoId: principal.ngo.ngoId, status: "offered" }, include: { report: { include: { location: true } } } });
  if (!offer) return NextResponse.json({ error: "Opportunity not found or no longer available." }, { status: 404 });
  if (body.decision === "decline") {
    await prisma.ngoReportOffer.update({ where: { offerId }, data: { status: "declined", respondedAt: new Date() } });
    return NextResponse.json({ offerId, status: "declined" });
  }
  if (!offer.report.locationId || !offer.report.location) return NextResponse.json({ error: "This report needs a location before it can be accepted." }, { status: 409 });
  try {
    const mission = await prisma.$transaction(async tx => {
      const fresh = await tx.ngoReportOffer.findFirst({ where: { offerId, status: "offered", report: { status: "open" } } });
      if (!fresh) throw new Error("OFFER_TAKEN");
      // Atomically reserve the report. This prevents two NGOs accepting the
      // same report concurrently without relying on a unique report_id index.
      const reserved = await tx.report.updateMany({ where: { reportId: offer.reportId, status: "open" }, data: { status: "assigned" } });
      if (reserved.count !== 1) throw new Error("OFFER_TAKEN");
      const created = await tx.mission.create({ data: { locationId: offer.report.locationId!, ngoId: principal.ngo.ngoId, reportId: offer.reportId, leadNgo: principal.ngo.name, missionType: offer.report.category, priority: /urgent|hazard/i.test(offer.report.severity) ? "high" : "moderate", status: "planned", assignedTo: "team", scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), totalSlots: 20, isActive: true } });
      await tx.ngoReportOffer.updateMany({ where: { reportId: offer.reportId, status: "offered" }, data: { status: "closed", respondedAt: new Date() } });
      await tx.ngoReportOffer.update({ where: { offerId }, data: { status: "accepted", respondedAt: new Date() } });
      await tx.missionStatusEvent.create({ data: { missionId: created.missionId, membershipId: principal.membership.membershipId, toStatus: "planned", note: "Created by accepting a report opportunity." } });
      return created;
    });
    return NextResponse.json({ mission }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFER_TAKEN") return NextResponse.json({ error: "This report has already been assigned." }, { status: 409 });
    throw error;
  }
}

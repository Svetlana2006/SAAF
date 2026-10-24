import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requireCsrPrincipal, isCsrResponse } from "@saaf/platform/csr-auth";

const schema = z.object({ missionId: z.string().trim().min(1).max(100), amount: z.number().positive().max(100_000_000), notes: z.string().trim().max(500).optional() });

export async function GET() {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  const grants = await prisma.csrGrant.findMany({
    where: { csrOrganizationId: principal.organization.csrOrganizationId },
    orderBy: { createdAt: "desc" },
    include: { mission: { select: { missionId: true, missionType: true, status: true, ngo: { select: { name: true } }, location: { select: { nameArea: true, wardZone: true } } } } },
  });
  return NextResponse.json({ grants });
}

export async function POST(request: NextRequest) {
  const principal = await requireCsrPrincipal();
  if (isCsrResponse(principal)) return principal;
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid mission and positive commitment amount.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const grant = await prisma.$transaction(async tx => {
      const mission = await tx.mission.findUnique({ where: { missionId: parsed.data.missionId }, select: { missionId: true, status: true, isActive: true } });
      if (!mission || !mission.isActive || mission.status === "completed") throw new Error("MISSION_UNAVAILABLE");
      return tx.csrGrant.create({ data: { csrOrganizationId: principal.organization.csrOrganizationId, missionId: mission.missionId, amount: parsed.data.amount, notes: parsed.data.notes || null }, include: { mission: { select: { missionId: true, missionType: true, status: true } } } });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ grant }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "MISSION_UNAVAILABLE") {
      return NextResponse.json({ error: "This mission is unavailable for a CSR commitment." }, { status: 404 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Your organization has already committed support for this mission." }, { status: 409 });
    }
    console.error("[csr-grant] commitment write failed");
    return NextResponse.json({ error: "Could not record the commitment. Please retry." }, { status: 500 });
  }
}

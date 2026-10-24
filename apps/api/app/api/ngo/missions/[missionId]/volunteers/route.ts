import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@saaf/platform/ngo-auth";
import { hasMissionCapacity } from "@saaf/platform/workflow-policy";

const schema = z.object({ volunteerId: z.string().min(1), role: z.string().trim().min(1).max(100) });

export async function GET(_request: NextRequest, context: { params: Promise<{ missionId: string }> }) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const { missionId } = await context.params;
  const mission = await prisma.mission.findFirst({ where: { missionId, ngoId: principal.ngo.ngoId }, select: { missionId: true } });
  if (!mission) return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  const assignments = await prisma.missionVolunteer.findMany({ where: { missionId }, include: { volunteer: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ assignments });
}

export async function POST(request: NextRequest, context: { params: Promise<{ missionId: string }> }) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const { missionId } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a volunteerId and role." }, { status: 400 });
  const mission = await prisma.mission.findFirst({ where: { missionId, ngoId: principal.ngo.ngoId }, include: { missionVolunteers: true } });
  if (!mission) return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  if (!mission.isActive || !["planned", "mobilizing", "in_progress"].includes(mission.status)) return NextResponse.json({ error: "This mission is not accepting volunteer assignments." }, { status: 409 });
  if (!hasMissionCapacity(mission.filledSlots, mission.totalSlots)) return NextResponse.json({ error: "This mission has no open volunteer slots." }, { status: 409 });
  const volunteer = await prisma.volunteer.findFirst({ where: { volunteerId: parsed.data.volunteerId, missionVolunteers: { some: { mission: { ngoId: principal.ngo.ngoId } } } }, select: { volunteerId: true } });
  if (!volunteer) return NextResponse.json({ error: "Volunteer not found." }, { status: 404 });
  try {
    const assignment = await prisma.$transaction(async tx => {
      const existing = await tx.missionVolunteer.findFirst({ where: { missionId, volunteerId: volunteer.volunteerId } });
      if (existing) throw Object.assign(new Error("DUPLICATE_ASSIGNMENT"), { code: "DUPLICATE_ASSIGNMENT" });
      const reserved = await tx.mission.updateMany({ where: { missionId, ngoId: principal.ngo.ngoId, isActive: true, status: { in: ["planned", "mobilizing", "in_progress"] }, filledSlots: { lt: mission.totalSlots } }, data: { filledSlots: { increment: 1 } } });
      if (reserved.count !== 1) throw Object.assign(new Error("MISSION_FULL"), { code: "MISSION_FULL" });
      const created = await tx.missionVolunteer.create({ data: { missionId, volunteerId: volunteer.volunteerId, role: parsed.data.role, status: "registered" } });
      return created;
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "This volunteer is already assigned." }, { status: 409 });
    if (error && typeof error === "object" && "code" in error && (error.code === "DUPLICATE_ASSIGNMENT" || error.code === "MISSION_FULL")) return NextResponse.json({ error: error.code === "MISSION_FULL" ? "This mission has no open volunteer slots." : "This volunteer is already assigned." }, { status: 409 });
    throw error;
  }
}

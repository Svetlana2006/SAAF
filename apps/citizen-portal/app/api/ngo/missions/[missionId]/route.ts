import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireNgoPrincipal, isNgoResponse } from "@/lib/ngo-auth";

const transitions: Record<string, string[]> = { planned: ["mobilizing"], mobilizing: ["in_progress", "planned"], in_progress: ["review_pending", "mobilizing"] };

export async function GET(_request: NextRequest, context: { params: Promise<{ missionId: string }> }) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const { missionId } = await context.params;
  const mission = await prisma.mission.findFirst({ where: { missionId, ngoId: principal.ngo.ngoId }, include: { location: true, report: true, missionVolunteers: { include: { volunteer: true } }, missionActivities: { orderBy: { createdAt: "desc" } }, evidences: { orderBy: { createdAt: "desc" } }, statusEvents: { orderBy: { createdAt: "desc" } } } });
  return mission ? NextResponse.json({ mission }) : NextResponse.json({ error: "Mission not found." }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ missionId: string }> }) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const { missionId } = await context.params;
  const parsed = z.object({ status: z.enum(["planned", "mobilizing", "in_progress", "review_pending"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid status." }, { status: 400 });
  const mission = await prisma.mission.findFirst({ where: { missionId, ngoId: principal.ngo.ngoId } });
  if (!mission) return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  if (!transitions[mission.status]?.includes(parsed.data.status)) return NextResponse.json({ error: `Cannot change mission from ${mission.status} to ${parsed.data.status}.` }, { status: 409 });
  const updated = await prisma.$transaction(async tx => {
    const result = await tx.mission.update({ where: { missionId }, data: { status: parsed.data.status, isActive: true } });
    await tx.missionStatusEvent.create({ data: { missionId, membershipId: principal.membership.membershipId, fromStatus: mission.status, toStatus: parsed.data.status, note: "Mission status updated by NGO partner." } });
    return result;
  });
  return NextResponse.json({ mission: updated });
}

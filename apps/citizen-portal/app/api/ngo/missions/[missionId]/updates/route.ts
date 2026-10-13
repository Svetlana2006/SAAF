import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@/lib/ngo-auth";

const updateSchema = z.object({ activityType: z.string().trim().min(1).max(80), description: z.string().trim().min(1).max(2000), progressPercent: z.number().int().min(0).max(100), status: z.string().trim().min(1).max(40).default("in_progress") });

export async function POST(request: NextRequest, context: { params: Promise<{ missionId: string }> }) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const { missionId } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid activity update.", details: parsed.error.flatten() }, { status: 400 });
  const mission = await prisma.mission.findFirst({ where: { missionId, ngoId: principal.ngo.ngoId } });
  if (!mission) return NextResponse.json({ error: "Mission not found." }, { status: 404 });
  const activity = await prisma.missionActivity.create({ data: { missionId, activityType: parsed.data.activityType, description: parsed.data.description, progressPercent: parsed.data.progressPercent, status: parsed.data.status, startTime: new Date() } });
  return NextResponse.json({ activity }, { status: 201 });
}

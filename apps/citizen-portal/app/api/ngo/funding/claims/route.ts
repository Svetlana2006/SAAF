import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@/lib/ngo-auth";

const schema = z.object({ missionId: z.string().min(1), title: z.string().trim().min(1).max(160), notes: z.string().trim().max(2000).optional(), items: z.array(z.object({ description: z.string().trim().min(1).max(200), amount: z.number().positive().finite() })).min(1).max(40) });

export async function GET(request: NextRequest) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const missionId = request.nextUrl.searchParams.get("missionId");
  const claims = await prisma.ngoCostClaim.findMany({ where: { ngoId: principal.ngo.ngoId, ...(missionId ? { missionId } : {}) }, include: { items: true, mission: { include: { location: true } } }, orderBy: { submittedAt: "desc" } });
  return NextResponse.json({ claims });
}

export async function POST(request: NextRequest) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cost claim.", details: parsed.error.flatten() }, { status: 400 });
  const mission = await prisma.mission.findFirst({ where: { missionId: parsed.data.missionId, ngoId: principal.ngo.ngoId } });
  if (!mission) return NextResponse.json({ error: "Mission not found for this NGO." }, { status: 404 });
  const amount = parsed.data.items.reduce((sum, item) => sum + item.amount, 0);
  const claim = await prisma.ngoCostClaim.create({ data: { ngoId: principal.ngo.ngoId, missionId: mission.missionId, title: parsed.data.title, notes: parsed.data.notes, amount, items: { create: parsed.data.items } }, include: { items: true } });
  return NextResponse.json({ claim }, { status: 201 });
}

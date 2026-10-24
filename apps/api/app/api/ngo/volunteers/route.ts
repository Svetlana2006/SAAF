import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@saaf/platform/prisma";
import { requireNgoPrincipal, isNgoResponse } from "@saaf/platform/ngo-auth";

export async function GET(request: NextRequest) {
  const principal = await requireNgoPrincipal(); if (isNgoResponse(principal)) return principal;
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const volunteers = await prisma.volunteer.findMany({
    where: {
      missionVolunteers: { some: { mission: { ngoId: principal.ngo.ngoId } } },
      ...(query ? { OR: [{ name: { contains: query.slice(0, 80), mode: "insensitive" } }, { skills: { has: query.slice(0, 80) } }] } : {}),
    },
    select: { volunteerId: true, name: true, skills: true, availability: true },
    take: 100,
    orderBy: { name: "asc" },
  });
  const assignments = await prisma.missionVolunteer.findMany({ where: { mission: { ngoId: principal.ngo.ngoId }, status: { not: "withdrawn" } }, select: { volunteerId: true, status: true, mission: { select: { missionId: true, status: true, scheduledDate: true } } } });
  return NextResponse.json({ volunteers, assignments });
}

/**
 * GET  /api/volunteers  — list all active Missions with slot info (for the signup form)
 * POST /api/volunteers  — register a Volunteer for a Mission (creates MissionVolunteer record)
 *
 * GET response: { success, data: Mission[] }
 * POST body:    { missionId, name, email, phone, skills[], preferredShift, consentGiven }
 * POST response: { success, data: { signupId, missionName, message } }
 */
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@saaf/platform/prisma";
import { ok, created, badRequest, notFound, withErrorHandling } from "@saaf/platform/api-helpers";
import { rateLimit } from "@saaf/platform/rate-limit";
import { VolunteerSignupSchema } from "../../../lib/public-input";
import { hasMissionCapacity } from "@saaf/platform/workflow-policy";

// ── GET /api/volunteers ──────────────────────────────────────────────────────
export async function GET() {
  return withErrorHandling(async () => {
    const missions = await prisma.mission.findMany({
      where: { isActive: true },
      orderBy: { scheduledDate: "asc" },
      include: {
        ngo: { select: { name: true } },
        location: { select: { nameArea: true, wardZone: true } },
        _count: { select: { missionVolunteers: true } },
      },
    });

    return ok(
      missions.map((m) => ({
        id: m.missionId,
        missionType: m.missionType,
        priority: m.priority,
        status: m.status,
        assignedTo: m.assignedTo,
        scheduledDate: m.scheduledDate,
        estimatedCost: m.estimatedCost,
        totalSlots: m.totalSlots,
        filledSlots: m.filledSlots,
        spotsLeft: Math.max(0, m.totalSlots - m.filledSlots),
        ngoName: m.ngo?.name ?? m.leadNgo,
        locationArea: m.location?.nameArea ?? "",
        wardZone: m.location?.wardZone ?? "",
        // Legacy fields kept for VolunteerPage.tsx compatibility
        slug: m.missionId,
        tag: `${m.priority.toUpperCase()} · ${m.missionType}`,
        wardLabel: m.location?.wardZone ?? "",
        name: `${m.missionType} Mission — ${m.location?.nameArea ?? ""}`,
        description: `Priority: ${m.priority}. Assigned to: ${m.assignedTo}. Status: ${m.status}.`,
        scheduledAt: m.scheduledDate,
        endsAt: m.scheduledDate,
        venue: m.location?.nameArea ?? "",
        leadNgo: m.ngo?.name ?? m.leadNgo,
        gearList: ["High-Vis Vest", "Nitrile Gloves", "N95 Mask"],
      }))
    );
  });
}

// ── POST /api/volunteers ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "volunteer-signup", 5, 60 * 60 * 1000);
  if (limited) return limited;
  return withErrorHandling(async () => {
    const body = VolunteerSignupSchema.parse(await req.json());

    if (!body.consentGiven) {
      return badRequest("You must accept the safety protocols to register.");
    }

    // Verify mission exists and has open slots
    const mission = await prisma.mission.findFirst({
      where: { missionId: body.missionId },
    });
    if (!mission) return notFound("Mission not found.");
    if (!mission.isActive || !["planned", "mobilizing", "in_progress"].includes(mission.status) || !hasMissionCapacity(mission.filledSlots, mission.totalSlots)) {
      return badRequest("This mission is fully booked. Please select another.");
    }

    // Upsert the Volunteer record, then create MissionVolunteer link
    const registration = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find or create the volunteer
      const vol = await tx.volunteer.upsert({
        where: { email: body.email },
        // Public signup does not prove control of an existing email. Reuse the
        // record for this mission without allowing an unauthenticated profile overwrite.
        update: {},
        create: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          skills: body.skills,
          availability: body.preferredShift,
        },
      });

      const existing = await tx.missionVolunteer.findFirst({ where: { missionId: body.missionId, volunteerId: vol.volunteerId } });
      if (existing) throw new Error("ALREADY_REGISTERED");

      const reservation = await tx.mission.updateMany({
        where: { missionId: body.missionId, isActive: true, status: { in: ["planned", "mobilizing", "in_progress"] }, filledSlots: { lt: mission.totalSlots } },
        data: { filledSlots: { increment: 1 } },
      });
      if (reservation.count !== 1) throw new Error("MISSION_FULL");

      // Create the mission–volunteer link
      const mv = await tx.missionVolunteer.create({
        data: {
          missionId: body.missionId,
          volunteerId: vol.volunteerId,
          role: body.skills.join(", "),
        },
      });

      return { volunteerRecord: vol, missionVolunteer: mv };
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message === "MISSION_FULL") return null;
      if (error instanceof Error && error.message === "ALREADY_REGISTERED") return "duplicate" as const;
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") return "duplicate" as const;
      throw error;
    });
    if (registration === "duplicate") return badRequest("This email is already registered for this mission.");
    if (!registration) return badRequest("This mission has just filled its remaining slots. Please choose another.");

    const { volunteerRecord, missionVolunteer } = registration;

    return created({
      signupId: missionVolunteer.missionVolunteerId,
      missionId: body.missionId,
      missionName: `${mission.missionType} — ${mission.assignedTo}`,
      volunteerName: volunteerRecord.name,
      preferredShift: body.preferredShift,
      confirmedAt: missionVolunteer.createdAt,
      message:
        "You are registered. Please save this confirmation; no WhatsApp notification is configured yet.",
    });
  });
}

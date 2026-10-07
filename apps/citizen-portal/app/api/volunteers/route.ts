/**
 * GET  /api/volunteers  — list all active Missions with slot info (for the signup form)
 * POST /api/volunteers  — register a Volunteer for a Mission (creates MissionVolunteer record)
 *
 * GET response: { success, data: Mission[] }
 * POST body:    { missionId, name, email, phone, skills[], preferredShift, consentGiven }
 * POST response: { success, data: { signupId, missionName, message } }
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, notFound, withErrorHandling } from "@/lib/api-helpers";

// ── GET /api/volunteers ──────────────────────────────────────────────────────
export async function GET(_req: NextRequest) {
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
      missions.map((m: any) => ({
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
const SignupSchema = z.object({
  missionId: z.string().min(1, "Mission ID is required"),
  name: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(8, "Valid phone required"),
  skills: z.array(z.string()).min(1, "Select at least one skill/role"),
  preferredShift: z.string().min(1, "Select a shift"),
  consentGiven: z.boolean({ required_error: "Consent is required" }),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = SignupSchema.parse(await req.json());

    if (!body.consentGiven) {
      return badRequest("You must accept the safety protocols to register.");
    }

    // Verify mission exists and has open slots
    const mission = await prisma.mission.findFirst({
      where: { missionId: body.missionId },
    });
    if (!mission) return notFound("Mission not found.");
    if (mission.filledSlots >= mission.totalSlots) {
      return badRequest("This mission is fully booked. Please select another.");
    }

    // Upsert the Volunteer record, then create MissionVolunteer link
    const [volunteerRecord, missionVolunteer] = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find or create the volunteer
      const vol = await tx.volunteer.upsert({
        where: { email: body.email },
        update: { name: body.name, phone: body.phone, skills: body.skills },
        create: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          skills: body.skills,
          availability: body.preferredShift,
        },
      });

      // Create the mission–volunteer link
      const mv = await tx.missionVolunteer.create({
        data: {
          missionId: body.missionId,
          volunteerId: vol.volunteerId,
          role: body.skills.join(", "),
        },
      });

      // Increment filledSlots atomically
      await tx.mission.update({
        where: { missionId: body.missionId },
        data: { filledSlots: { increment: 1 } },
      });

      return [vol, mv];
    });

    return created({
      signupId: missionVolunteer.missionVolunteerId,
      missionId: body.missionId,
      missionName: `${mission.missionType} — ${mission.assignedTo}`,
      volunteerName: volunteerRecord.name,
      preferredShift: body.preferredShift,
      confirmedAt: missionVolunteer.createdAt,
      message:
        "You are registered! You will receive a WhatsApp confirmation with reporting coordinates and your safety kit credentials.",
    });
  });
}

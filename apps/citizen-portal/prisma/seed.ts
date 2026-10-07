/**
 * Prisma seed script — populates the SAAF database with realistic demo data
 * matching the EER diagram entities: Citizen, Location, NGO, Volunteer,
 * Report, Mission, MissionVolunteer, Hotspot, RootCause, Intervention, Evidence.
 *
 * Run: npm run db:seed --workspace=apps/citizen-portal
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SAAF database...");

  // ── Locations ─────────────────────────────────────────────────────────────
  const loc84 = await prisma.location.upsert({
    where: { locationId: "loc-civil-lines" },
    update: {},
    create: {
      locationId: "loc-civil-lines",
      nameArea: "Civil Lines & Kashmere Gate",
      address: "Near Sluice Gate #84-B, Ring Road Underpass, Civil Lines",
      latitude: 28.668,
      longitude: 77.231,
      wardZone: "Central Delhi Municipal Zone",
      areaType: "residential",
      isHotspot: true,
    },
  });

  const loc42 = await prisma.location.upsert({
    where: { locationId: "loc-mori-gate" },
    update: {},
    create: {
      locationId: "loc-mori-gate",
      nameArea: "Mori Gate",
      address: "Mori Gate Bus Terminal, Kashmere Gate, New Delhi",
      latitude: 28.657,
      longitude: 77.224,
      wardZone: "Central Delhi Municipal Zone",
      areaType: "residential",
      isHotspot: false,
    },
  });

  const locYamuna = await prisma.location.upsert({
    where: { locationId: "loc-yamuna-ghat" },
    update: {},
    create: {
      locationId: "loc-yamuna-ghat",
      nameArea: "Yamuna Ghat",
      address: "Yamuna Ghat, Salimgarh Fort Rd, Civil Lines",
      latitude: 28.671,
      longitude: 77.238,
      wardZone: "Central Delhi Municipal Zone",
      areaType: "slum",
      isHotspot: true,
    },
  });

  console.log("✅ Locations seeded");

  // ── Citizens ──────────────────────────────────────────────────────────────
  const citizen1 = await prisma.citizen.upsert({
    where: { email: "aarav.sharma@civicmail.in" },
    update: {},
    create: {
      name: "Aarav Sharma",
      email: "aarav.sharma@civicmail.in",
      phone: "+919811240912",
      role: "citizen",
      location: "Civil Lines, Ward 84",
      isAnonymous: false,
    },
  });

  const citizen2 = await prisma.citizen.upsert({
    where: { email: "priya.mehta@rwa84.in" },
    update: {},
    create: {
      name: "Priya Mehta",
      email: "priya.mehta@rwa84.in",
      phone: "+919810012345",
      role: "RWA",
      location: "Kashmere Gate",
      isAnonymous: false,
    },
  });

  console.log("✅ Citizens seeded");

  // ── NGOs ──────────────────────────────────────────────────────────────────
  const ngo1 = await prisma.ngo.upsert({
    where: { email: "info@safaishakti.org" },
    update: {},
    create: {
      name: "Safai Shakti Guild",
      contactPerson: "Rajesh Pawar",
      email: "info@safaishakti.org",
      phone: "+911123456789",
      expertiseAreas: ["desilting", "plastic_recovery", "waste_segregation"],
      address: "Kashmere Gate, New Delhi",
    },
  });

  const ngo2 = await prisma.ngo.upsert({
    where: { email: "ops@cleancityalliance.org" },
    update: {},
    create: {
      name: "CleanCity Alliance",
      contactPerson: "Sunita Kapoor",
      email: "ops@cleancityalliance.org",
      phone: "+911198765432",
      expertiseAreas: ["rubble_clearance", "awareness_campaigns"],
      address: "Mori Gate, New Delhi",
    },
  });

  const ngo3 = await prisma.ngo.upsert({
    where: { email: "contact@karmaeco.org" },
    update: {},
    create: {
      name: "New Karma Eco Taskforce",
      contactPerson: "Arjun Singh",
      email: "contact@karmaeco.org",
      phone: "+911144332211",
      expertiseAreas: ["bio_planting", "screening", "awareness_campaigns"],
      address: "Civil Lines, New Delhi",
    },
  });

  console.log("✅ NGOs seeded");

  // ── Volunteers ────────────────────────────────────────────────────────────
  const vol1 = await prisma.volunteer.upsert({
    where: { email: "meera.bose@example.com" },
    update: {},
    create: {
      name: "Meera Bose",
      email: "meera.bose@example.com",
      phone: "+919900112233",
      skills: ["Waste Segregation & Plastic Triage", "Photo Telemetry & Verification Audit"],
      availability: "Morning Shift",
    },
  });

  const vol2 = await prisma.volunteer.upsert({
    where: { email: "rajan.kumar@example.com" },
    update: {},
    create: {
      name: "Rajan Kumar",
      email: "rajan.kumar@example.com",
      phone: "+919811223344",
      skills: ["Drain Desilting & Ground Support", "Community Marshalling & Safety Cordons"],
      availability: "Weekend Blitz",
    },
  });

  console.log("✅ Volunteers seeded");

  // ── Reports ───────────────────────────────────────────────────────────────
  const report1 = await prisma.report.upsert({
    where: { reportId: "rpt-mcd-8409" },
    update: {},
    create: {
      reportId: "rpt-mcd-8409",
      citizenId: citizen1.citizenId,
      locationId: loc84.locationId,
      category: "Overflowing Garbage Dump",
      severity: "Urgent / Obstruction",
      description:
        "Community bin at the junction has spilled over onto the pedestrian walkway and is blocking the stormwater gully.",
      photoUrl: null,
      status: "completed",
    },
  });

  const report2 = await prisma.report.upsert({
    where: { reportId: "rpt-yamuna-001" },
    update: {},
    create: {
      reportId: "rpt-yamuna-001",
      citizenId: citizen2.citizenId,
      locationId: locYamuna.locationId,
      category: "Choked Storm Drain",
      severity: "Hazardous Spill",
      description:
        "Riverbank drain is completely choked with plastic debris. Floating plastics visible 200m downstream.",
      photoUrl: null,
      status: "assigned",
    },
  });

  console.log("✅ Reports seeded");

  // ── Missions ──────────────────────────────────────────────────────────────
  const mission1 = await prisma.mission.upsert({
    where: { missionId: "msn-yamuna-2026-10-22" },
    update: {},
    create: {
      missionId: "msn-yamuna-2026-10-22",
      locationId: locYamuna.locationId,
      ngoId: ngo1.ngoId,
      leadNgo: "Safai Shakti Guild",
      missionType: "cleanup",
      priority: "high",
      status: "planned",
      assignedTo: "team",
      scheduledDate: new Date("2026-10-22T07:30:00+05:30"),
      estimatedCost: 18000,
      totalSlots: 20,
      filledSlots: 14,
      isActive: true,
    },
  });

  const mission2 = await prisma.mission.upsert({
    where: { missionId: "msn-kashmere-2026-10-23" },
    update: {},
    create: {
      missionId: "msn-kashmere-2026-10-23",
      locationId: loc84.locationId,
      ngoId: ngo2.ngoId,
      leadNgo: "CleanCity Alliance",
      missionType: "cleanup",
      priority: "moderate",
      status: "planned",
      assignedTo: "team",
      scheduledDate: new Date("2026-10-23T08:00:00+05:30"),
      estimatedCost: 12000,
      totalSlots: 20,
      filledSlots: 12,
      isActive: true,
    },
  });

  const mission3 = await prisma.mission.upsert({
    where: { missionId: "msn-mori-2026-10-26" },
    update: {},
    create: {
      missionId: "msn-mori-2026-10-26",
      locationId: loc42.locationId,
      ngoId: ngo3.ngoId,
      leadNgo: "New Karma Eco Taskforce",
      missionType: "awareness",
      priority: "low",
      status: "planned",
      assignedTo: "volunteers",
      scheduledDate: new Date("2026-10-26T16:30:00+05:30"),
      estimatedCost: 8000,
      totalSlots: 25,
      filledSlots: 10,
      isActive: true,
    },
  });

  console.log("✅ Missions seeded");

  // ── Mission Volunteers ────────────────────────────────────────────────────
  await prisma.missionVolunteer.upsert({
    where: { missionVolunteerId: "mv-001" },
    update: {},
    create: {
      missionVolunteerId: "mv-001",
      missionId: mission1.missionId,
      volunteerId: vol1.volunteerId,
      role: "Waste Segregation & Plastic Triage",
    },
  });

  await prisma.missionVolunteer.upsert({
    where: { missionVolunteerId: "mv-002" },
    update: {},
    create: {
      missionVolunteerId: "mv-002",
      missionId: mission1.missionId,
      volunteerId: vol2.volunteerId,
      role: "Drain Desilting & Ground Support",
    },
  });

  console.log("✅ Mission volunteers seeded");

  // ── Hotspots ──────────────────────────────────────────────────────────────
  const hotspot1 = await prisma.hotspot.upsert({
    where: { hotspotId: "hs-civil-lines-001" },
    update: {},
    create: {
      hotspotId: "hs-civil-lines-001",
      locationId: loc84.locationId,
      recurrenceCount: 7,
      lastCleanedDate: new Date("2026-09-15"),
      status: "active",
    },
  });

  const hotspot2 = await prisma.hotspot.upsert({
    where: { hotspotId: "hs-yamuna-001" },
    update: {},
    create: {
      hotspotId: "hs-yamuna-001",
      locationId: locYamuna.locationId,
      recurrenceCount: 12,
      lastCleanedDate: new Date("2026-08-20"),
      status: "active",
    },
  });

  console.log("✅ Hotspots seeded");

  // ── Root Causes ───────────────────────────────────────────────────────────
  await prisma.rootCause.upsert({
    where: { rootCauseId: "rc-001" },
    update: {},
    create: {
      rootCauseId: "rc-001",
      hotspotId: hotspot1.hotspotId,
      causeType: "dumping",
      description:
        "Commercial vendors illegally dump packaging waste overnight at the junction.",
      recommendedIntervention: "Install CCTV + deploy waste collectors at 5 AM daily.",
    },
  });

  await prisma.rootCause.upsert({
    where: { rootCauseId: "rc-002" },
    update: {},
    create: {
      rootCauseId: "rc-002",
      hotspotId: hotspot2.hotspotId,
      causeType: "drainage",
      description:
        "Storm drain outfall blocked by riverbank plastic accumulation causing repeated backup.",
      recommendedIntervention: "Deploy floating plastic boom + mechanized dredging quarterly.",
    },
  });

  console.log("✅ Root causes seeded");

  // ── Interventions ─────────────────────────────────────────────────────────
  await prisma.intervention.upsert({
    where: { interventionId: "int-001" },
    update: {},
    create: {
      interventionId: "int-001",
      hotspotId: hotspot1.hotspotId,
      type: "infrastructure",
      description:
        "Install 2 CCTV cameras and deploy community bin with steel lock mechanism.",
      status: "planned",
    },
  });

  console.log("✅ Interventions seeded");

  // ── Evidence ──────────────────────────────────────────────────────────────
  await prisma.evidence.upsert({
    where: { evidenceId: "ev-001" },
    update: {},
    create: {
      evidenceId: "ev-001",
      missionId: mission1.missionId,
      type: "before",
      photoUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      locationLat: locYamuna.latitude,
      locationLong: locYamuna.longitude,
      verified: true,
      verifiedBy: "Rajesh Pawar",
    },
  });

  console.log("✅ Evidence seeded");

  console.log("🎉 Seed complete. SAAF database is ready!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { z } from "zod";

export const PublicReportBodySchema = z.object({
  category: z.enum(["Overflowing Garbage Dump", "C&D Debris (Construction)", "Choked Storm Drain", "Hazardous / Bio-Medical", "Open Sewage Leak", "Public Toilet Disrepair"]),
  severity: z.enum(["Routine Cleanup", "Elevated Priority", "Urgent / Obstruction", "Hazardous Spill"]),
  description: z.string().trim().max(500).default(""),
  latitude: z.string().min(1).transform(Number).pipe(z.number().finite().min(-90).max(90)),
  longitude: z.string().min(1).transform(Number).pipe(z.number().finite().min(-180).max(180)),
  address: z.string().trim().min(1).max(300),
  isAnonymous: z.enum(["true", "false"]).default("true").transform(value => value === "true"),
});

export const VolunteerSignupSchema = z.object({
  missionId: z.string().min(1).max(64),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(8).max(32),
  skills: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
  preferredShift: z.string().trim().min(1).max(100),
  consentGiven: z.boolean(),
});

export const OpportunityDecisionSchema = z.object({ decision: z.enum(["accept", "decline"]) });

import { z } from "zod";

export const CsrGrantInputSchema = z.object({
  missionId: z.string().trim().min(1).max(100),
  amount: z.number().positive().max(100_000_000).refine(value => Math.abs(Math.round(value * 100) - value * 100) < 1e-8, "Use no more than two decimal places."),
  notes: z.string().trim().max(500).optional(),
});

export const CsrMissionQuerySchema = z.object({
  view: z.enum(["available", "supported", "all"]).default("all"),
  q: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  fundingStatus: z.enum(["committed", "released", "cancelled"]).optional(),
  location: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  ngo: z.string().trim().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function isDuplicateCsrGrantError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

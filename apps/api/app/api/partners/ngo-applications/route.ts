import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { rateLimit } from "@saaf/platform/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  contactPerson: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(300),
  registrationNumber: z.string().trim().max(80).optional().or(z.literal("")),
  expertiseAreas: z.array(z.string().trim().min(2).max(60)).min(1).max(12),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "ngo-application", 5, 60 * 60 * 1000);
  if (limited) return limited;
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Check the application fields.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  const existing = await prisma.ngoApplication.findFirst({ where: { email: parsed.data.email, status: "pending" } });
  if (existing) return NextResponse.json({ error: "An application for this email is already awaiting review." }, { status: 409 });
  const ngo = await prisma.ngo.findUnique({ where: { email: parsed.data.email } });
  if (ngo) return NextResponse.json({ error: "This email already belongs to an active NGO account." }, { status: 409 });
  const application = await prisma.ngoApplication.create({ data: { ...parsed.data, registrationNumber: parsed.data.registrationNumber || null } });
  return NextResponse.json({ applicationId: application.applicationId, status: application.status }, { status: 201 });
}

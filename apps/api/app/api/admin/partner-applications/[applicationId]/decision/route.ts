import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { createAdminClient } from "@saaf/platform/supabase/admin";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

const bodySchema = z.object({ type: z.enum(["ngo", "csr"]), decision: z.enum(["approve", "reject"]), approvedFundingBudget: z.number().positive().max(100_000_000).refine(value => Math.abs(Math.round(value * 100) - value * 100) < 1e-8).optional() });

async function findOrInviteUser(email: string, fullName: string, portal: "ngo" | "csr") {
  const admin = createAdminClient();
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Could not check Supabase accounts for this applicant.");
    const user = data.users.find(item => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return { admin, user, invited: false };
    if (data.users.length < 1000) break;
  }
  const portalUrl = portal === "ngo"
    ? (process.env.NGO_PORTAL_URL ?? "http://localhost:3002")
    : (process.env.CSR_PORTAL_URL ?? "http://localhost:3003");
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName }, redirectTo: new URL("/auth/callback?next=%2Fauth%2Fset-password", portalUrl).toString() });
  if (error || !data.user) throw new Error("Could not send an account invitation. Check Supabase Auth email settings and retry.");
  return { admin, user: data.user, invited: true };
}

export async function POST(request: NextRequest, context: { params: Promise<{ applicationId: string }> }) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const { applicationId } = await context.params;
  if (!applicationId || applicationId.length > 100) return NextResponse.json({ error: "Invalid application identifier." }, { status: 400 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Choose an application type and decision." }, { status: 400 });
  if (parsed.data.type === "csr" && parsed.data.decision === "approve" && parsed.data.approvedFundingBudget == null) return NextResponse.json({ error: "Enter an approved CSR commitment budget before approval." }, { status: 400 });

  if (parsed.data.decision === "reject") {
    const result = parsed.data.type === "ngo"
      ? await prisma.ngoApplication.updateMany({ where: { applicationId, status: "pending" }, data: { status: "rejected", reviewedAt: new Date(), reviewedBy: principal.user.id } })
      : await prisma.csrApplication.updateMany({ where: { applicationId, status: "pending" }, data: { status: "rejected", reviewedAt: new Date(), reviewedBy: principal.user.id } });
    if (!result.count) return NextResponse.json({ error: "Pending application not found." }, { status: 404 });
    return NextResponse.json({ status: "rejected" });
  }

  try {
    let invitationSent = false;
    if (parsed.data.type === "ngo") {
      const application = await prisma.ngoApplication.findFirst({ where: { applicationId, status: "pending" } });
      if (!application) return NextResponse.json({ error: "Pending NGO application not found." }, { status: 404 });
      const { user, invited } = await findOrInviteUser(application.email, application.contactPerson, "ngo");
      invitationSent = invited;
      await prisma.$transaction(async tx => {
        const stillPending = await tx.ngoApplication.findFirst({ where: { applicationId, status: "pending" } });
        if (!stillPending) throw new Error("This application has already been reviewed.");
        const existingMembership = await tx.ngoMembership.findFirst({ where: { supabaseUserId: user.id, isActive: true } });
        if (existingMembership) throw new Error("This user already has an active NGO membership.");
        const ngo = await tx.ngo.create({ data: { name: application.name, contactPerson: application.contactPerson, email: application.email, phone: application.phone, address: application.address, expertiseAreas: application.expertiseAreas } });
        await tx.ngoMembership.create({ data: { supabaseUserId: user.id, ngoId: ngo.ngoId, role: "owner", isActive: true } });
        await tx.ngoApplication.update({ where: { applicationId }, data: { status: "approved", reviewedAt: new Date(), reviewedBy: principal.user.id } });
      });
    } else {
      const application = await prisma.csrApplication.findFirst({ where: { applicationId, status: "pending" } });
      if (!application) return NextResponse.json({ error: "Pending CSR application not found." }, { status: 404 });
      const { admin, user, invited } = await findOrInviteUser(application.email, application.contactPerson, "csr");
      invitationSent = invited;
      const { data: updated, error: roleError } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...(user.app_metadata ?? {}), role: "csr" },
      });
      if (roleError || !updated.user) throw new Error("Could not grant the CSR portal role. Retry the approval.");
      await prisma.$transaction(async tx => {
        const stillPending = await tx.csrApplication.findFirst({ where: { applicationId, status: "pending" } });
        if (!stillPending) throw new Error("This application has already been reviewed.");
        const organization = await tx.csrOrganization.create({ data: { name: application.organizationName, contactPerson: application.contactPerson, email: application.email, phone: application.phone, registrationNumber: application.registrationNumber, approvedFundingBudget: parsed.data.approvedFundingBudget! } });
        await tx.csrMembership.create({ data: { supabaseUserId: user.id, csrOrganizationId: organization.csrOrganizationId, role: "owner", isActive: true } });
        await tx.csrApplication.update({ where: { applicationId }, data: { status: "approved", reviewedAt: new Date(), reviewedBy: principal.user.id } });
      });
    }
    return NextResponse.json({ status: "approved", invitationSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not approve application.";
    if (/Supabase admin provisioning is not configured/.test(message)) return NextResponse.json({ error: "Partner account provisioning is not configured. Set the server-only SUPABASE_SERVICE_ROLE_KEY in apps/api/.env." }, { status: 503 });
    if (/Could not send an account invitation/.test(message)) return NextResponse.json({ error: "Could not send the account invitation. Check Supabase Auth email settings and retry." }, { status: 502 });
    if (/already reviewed|already has an active NGO membership|Unique constraint/i.test(message)) return NextResponse.json({ error: "This application was reviewed already or its account is already linked to an organization." }, { status: 409 });
    if (/Could not grant the CSR portal role/.test(message)) return NextResponse.json({ error: "Could not activate CSR access. Retry the approval." }, { status: 502 });
    console.error("[partner-application] approval failed");
    return NextResponse.json({ error: "Could not approve the application. Review server configuration and retry." }, { status: 502 });
  }
}

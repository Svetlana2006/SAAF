import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { requirePortalRole, isRoleAuthResponse } from "@saaf/platform/role-auth";

export async function GET(request: NextRequest) {
  const principal = await requirePortalRole(["admin"]);
  if (isRoleAuthResponse(principal)) return principal;
  const parsed = z.enum(["all", "ngo", "csr"]).safeParse(request.nextUrl.searchParams.get("type") ?? "all");
  if (!parsed.success) return NextResponse.json({ error: "type must be all, ngo, or csr." }, { status: 400 });
  const [ngoApplications, csrApplications] = await Promise.all([
    parsed.data === "csr" ? [] : prisma.ngoApplication.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    parsed.data === "ngo" ? [] : prisma.csrApplication.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return NextResponse.json({ ngoApplications, csrApplications });
}

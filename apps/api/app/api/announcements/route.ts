import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@saaf/platform/prisma";
import { resolveCitizenSession } from "@saaf/platform/citizen-auth";
import { requireNgoPrincipal, isNgoResponse } from "@saaf/platform/ngo-auth";
import { requireCsrPrincipal, isCsrResponse } from "@saaf/platform/csr-auth";

export async function GET(request: NextRequest) {
  const parsed = z.enum(["all", "citizen", "ngo", "csr"]).safeParse(request.nextUrl.searchParams.get("audience") ?? "all");
  if (!parsed.success) return NextResponse.json({ error: "Invalid audience." }, { status: 400 });
  if (parsed.data === "citizen") {
    const session = await resolveCitizenSession(request);
    if (session.response) return session.response;
  } else if (parsed.data === "ngo") {
    const principal = await requireNgoPrincipal();
    if (isNgoResponse(principal)) return principal;
  } else if (parsed.data === "csr") {
    const principal = await requireCsrPrincipal();
    if (isCsrResponse(principal)) return principal;
  }
  try {
    const announcements = await prisma.announcement.findMany({
      where: { status: "published", audience: { in: parsed.data === "all" ? ["all"] : ["all", parsed.data] } },
      orderBy: { publishedAt: "desc" }, take: 50,
      select: { announcementId: true, title: true, message: true, audience: true, publishedAt: true },
    });
    return NextResponse.json({ announcements }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[announcements] public query failed", error);
    return NextResponse.json({ error: "Announcements are temporarily unavailable." }, { status: 503 });
  }
}

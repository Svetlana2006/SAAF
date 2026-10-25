import NgoShell from "@/components/ngo/NgoShell";
import { cookies } from "next/headers";
import { NGO_SESSION_COOKIE, verifyNgoSessionToken } from "@saaf/platform/ngo-session";
import { redirect } from "next/navigation";

export default async function NgoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let hasValidSession = false;
  try {
    const cookieStore = await cookies();
    hasValidSession = Boolean(verifyNgoSessionToken(cookieStore.get(NGO_SESSION_COOKIE)?.value));
  } catch {
    redirect("/login?reason=auth-config");
  }
  if (!hasValidSession) redirect("/login");

  return <NgoShell>{children}</NgoShell>;
}

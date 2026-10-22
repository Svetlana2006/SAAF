import NgoShell from "@/components/ngo/NgoShell";
import { createClient } from "@saaf/platform/supabase/server";
import { redirect } from "next/navigation";

export default async function NgoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    redirect("/login?reason=auth-config");
  }

  let hasAuthenticatedUser = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    hasAuthenticatedUser = !error && Boolean(data.user);
  } catch {
    // A missing or expired session, or a temporarily unreachable auth service,
    // is not a portal configuration error.
  }
  if (!hasAuthenticatedUser) redirect("/login?reason=session");

  return <NgoShell>{children}</NgoShell>;
}

import NgoShell from "@/components/ngo/NgoShell";
import { createClient } from "@saaf/platform/supabase/server";
import { redirect } from "next/navigation";

export default async function NgoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) redirect("/login?reason=session");
  } catch {
    redirect("/login?reason=auth-config");
  }
  return <NgoShell>{children}</NgoShell>;
}

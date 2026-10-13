import NgoShell from "@/components/ngo/NgoShell";
import { getNgoAccessState } from "@/lib/ngo-auth";
import { redirect } from "next/navigation";

export default async function NgoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getNgoAccessState();
  if (access.kind === "unlinked") redirect("/ngo-access?reason=membership");
  if (access.kind === "auth_config_error") redirect("/ngo-access?reason=auth-config");
  if (access.kind === "database_error") redirect("/ngo-access?reason=database");
  if (access.kind === "signed_out") redirect("/ngo-access?reason=session");
  return <NgoShell>{children}</NgoShell>;
}

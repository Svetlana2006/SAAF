import NgoShell from "@/components/ngo/NgoShell";
import { getNgoAccessState } from "@saaf/platform/ngo-auth";
import { redirect } from "next/navigation";

export default async function NgoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const state = await getNgoAccessState();
  if (state.kind === "auth_config_error") redirect("/login?reason=auth-config");
  if (state.kind === "signed_out") redirect("/login");
  if (state.kind === "forbidden") redirect("/login?reason=role");
  if (state.kind === "unlinked") redirect("/login?reason=membership");
  if (state.kind === "database_error") redirect("/login?reason=database");

  return <NgoShell>{children}</NgoShell>;
}

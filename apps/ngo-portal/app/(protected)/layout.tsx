import NgoShell from "@/components/ngo/NgoShell";

export const dynamic = "force-dynamic";

export default function NgoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <NgoShell>{children}</NgoShell>;
}

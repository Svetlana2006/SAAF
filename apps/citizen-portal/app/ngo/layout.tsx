import NgoShell from "@/components/ngo/NgoShell";

export default function NgoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <NgoShell>{children}</NgoShell>;
}

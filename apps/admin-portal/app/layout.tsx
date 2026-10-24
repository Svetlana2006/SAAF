import InstitutionShell, { InstitutionNav } from "@saaf/ui/institutional/InstitutionShell";
import "./globals.css";
const nav: InstitutionNav[] = [
  { href: "/", label: "Admin Management Dashboard", icon: "▦" },
  { href: "/applications", label: "Partner applications", icon: "✉" },
  { href: "/updates", label: "Updates", icon: "☑", badge: "4 New" },
  { href: "/funding", label: "Monitor Funding", icon: "▣" },
  { href: "/missions", label: "Monitor Missions", icon: "◰", badge: "12 Live" },
  { href: "/complaints", label: "Monitor Complaints", icon: "⚠", badge: "8 Hot" },
];
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><InstitutionShell portal="admin" brand="SAAF" descriptor="SPOT · ASSESS · ACT" status="Municipal administration workspace" user="Authorized administrator" nav={nav} credential={{ title: "Administrator access", lines: ["Access assigned by the SAAF administrator.", "Dashboard data are demonstration content."] }}>{children}</InstitutionShell></body></html>;
}

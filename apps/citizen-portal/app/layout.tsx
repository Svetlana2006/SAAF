import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAAF Citizen Hub | Verified Urban Sanitation",
  description: "Report sanitation issues, track neighborhood cleanup, and join verified SAAF civic action missions across Delhi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}

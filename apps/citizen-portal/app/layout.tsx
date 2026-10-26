import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import CitizenAnnouncementFeed from "@/components/CitizenAnnouncementFeed";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAAF Citizen Hub | Verified Urban Sanitation",
  description: "Report sanitation issues, track neighborhood cleanup, and join verified SAAF civic action missions across Delhi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const authConfigured = Boolean(publishableKey);

  return <html lang="en" suppressHydrationWarning><body>
    {authConfigured ? (
      <ClerkProvider publishableKey={publishableKey}><CitizenAnnouncementFeed/>{children}</ClerkProvider>
    ) : (
      children
    )}
  </body></html>;
}

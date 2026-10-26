import "./globals.css";
import AnnouncementFeed from "@saaf/ui/institutional/AnnouncementFeed";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><AnnouncementFeed audience="ngo"/>{children}</body></html>;
}

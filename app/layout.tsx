import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppSidebar, type AppSidebarUser } from "@/components/app-sidebar";
import { getTeam } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Lyra AI — RFP Agent",
  description:
    "AI-native RFP response workflow for vendors selling into enterprise.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const team = getTeam();
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            <AppSidebar companyName={team.company.name} user={user} />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

async function getCurrentUser(): Promise<AppSidebarUser | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) return null;
    const email = data.user.email;
    const initials = email
      .split("@")[0]
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || email[0]?.toUpperCase() || "?";
    return { email, initials };
  } catch {
    // Supabase env unset (local dev without keys) — render anonymous chrome.
    return null;
  }
}

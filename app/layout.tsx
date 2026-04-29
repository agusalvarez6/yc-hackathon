import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/app-sidebar";
import { getTeam } from "@/lib/data";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const team = getTeam();
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
            <AppSidebar companyName={team.company.name} />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

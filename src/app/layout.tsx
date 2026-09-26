import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Newsreader } from "next/font/google";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { AppShell } from "@/components/layout/AppShell";
import { NativeBridge } from "@/components/native/NativeBridge";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { UserLibraryProvider } from "@/components/providers/UserLibraryProvider";
import { SITE_FULL_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#06070a",
};

export const metadata: Metadata = {
  title: {
    default: SITE_FULL_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: SITE_FULL_NAME,
    title: SITE_FULL_NAME,
    description: SITE_TAGLINE,
  },
  twitter: { card: "summary_large_image", title: SITE_FULL_NAME, description: SITE_TAGLINE },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="noir" className={`${geistSans.variable} ${newsreader.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <AuthProvider>
          <UserLibraryProvider>
            <ThemeProvider>
              <PageViewTracker />
              <InstallBanner />
              <ServiceWorkerRegister />
              <NativeBridge />
              <AppShell>{children}</AppShell>
            </ThemeProvider>
          </UserLibraryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

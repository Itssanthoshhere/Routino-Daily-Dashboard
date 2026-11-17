import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaSupport } from "@/components/PwaSupport";

export const viewport: Viewport = {
  themeColor: "#A4161A",
};

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Routino", statusBarStyle: "default" },
  title: "Routino — Your daily routine, schedule, and focus in one",
  description: "A calm, private workspace for your schedule, important email, and daily priorities.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192",
  },
  openGraph: {
    title: "Routino — Your daily routine, schedule, and focus in one",
    description: "A calm, private workspace for your schedule, important email, and daily priorities.",
    siteName: "Routino",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}<PwaSupport /></body>
    </html>
  );
}

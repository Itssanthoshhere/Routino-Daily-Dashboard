import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Routino — Your daily routine, schedule, and focus in one",
  description: "A calm, private workspace for your schedule, important email, and daily priorities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

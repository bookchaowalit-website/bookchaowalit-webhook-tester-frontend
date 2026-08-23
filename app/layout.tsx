import type { Metadata } from "next";
import { Barlow_Condensed, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const intakeSans = Barlow_Condensed({ variable: "--font-intake-sans", subsets: ["latin"], weight: ["400", "600", "700"] });
const intakeMono = Roboto_Mono({ variable: "--font-intake-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Intake — Webhook request inspector",
  description: "Create a temporary webhook capture address and inspect incoming request envelopes.",
  metadataBase: new URL("https://webhook-tester.bookchaowalit.com"),
  alternates: { canonical: "https://webhook-tester.bookchaowalit.com" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={intakeSans.variable + " " + intakeMono.variable}><body><Analytics /><SpeedInsights />{children}</body></html>;
}


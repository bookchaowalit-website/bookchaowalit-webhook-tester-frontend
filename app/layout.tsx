import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Webhook Tester — Inspect webhook payloads instantly",
  description: "Get a capture URL, point any webhook at it, and inspect headers, body, and timing in real time. No signup, no tunnel required.",
  keywords: ['webhook tester', 'webhook debugging', 'request inspector', 'Next.js', 'developer tools'],
  authors: [{ name: 'Bookchaowalit', url: 'https://bookchaowalit.com' }],
  creator: 'Bookchaowalit',
  publisher: 'Bookchaowalit',
  metadataBase: new URL('https://webhook-tester.bookchaowalit.com'),
  alternates: {
    canonical: 'https://webhook-tester.bookchaowalit.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://webhook-tester.bookchaowalit.com',
    title: 'Webhook Tester — Inspect webhook payloads instantly',
    description: 'Get a capture URL, point any webhook at it, and inspect headers, body, and timing in real time.',
    siteName: 'Webhook Tester',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Webhook Tester',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Webhook Tester — Inspect webhook payloads instantly',
    description: 'Get a capture URL, point any webhook at it, and inspect headers, body, and timing in real time.',
    images: ['/og-image.png'],
    creator: '@bookchaowalit',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <SpeedInsights />
        {children}
      </body>
    </html>
  );
}

// SEO TODO: Add Open Graph tags for social sharing

import type { Metadata } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Wind } from "lucide-react";
import { AuthNav } from "@/components/AuthNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SmogShield — Urban Air Quality & Low-Emission Assistant",
  description:
    "Calibrated winter smog routines, hourly PM2.5 forecasting, and evidence-informed indoor air quality mitigation for urban households.",
  keywords: [
    "air quality",
    "winter smog",
    "PM2.5",
    "indoor air quality",
    "low emission",
    "urban smog",
    "AQI assistant",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#F6F6F3] text-stone-950 font-sans selection:bg-stone-200 selection:text-stone-900">
        {/* WCAG 2.1 AA Keyboard Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-stone-950 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 shadow-md"
        >
          Skip to main content
        </a>

        {/* Compact 56px sticky header with landmark */}
        <header
          role="banner"
          aria-label="Site Header"
          className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur-sm border-b border-stone-200"
        >
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
            {/* Left: Monochrome Wind mark + SmogShield */}
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
              aria-label="SmogShield Home"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#164E3B] text-white">
                <Wind className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-base font-semibold tracking-tight text-stone-950">
                SmogShield
              </span>
            </Link>

            {/* Right: Subtle live status dot + AuthNav */}
            <div className="flex items-center gap-4">
              <div
                className="inline-flex items-center gap-1.5 text-xs text-stone-700"
                aria-label="System status: Live AQI telemetry active"
              >
                <span
                  className="h-2 w-2 rounded-full bg-emerald-600"
                  aria-hidden="true"
                />
                <span className="font-medium">Live AQI</span>
              </div>
              <nav aria-label="Account Navigation">
                <AuthNav />
              </nav>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
      </body>
    </html>
  );
}

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
        {/* Compact 56px sticky header */}
        <header className="sticky top-0 z-50 h-14 bg-white/95 backdrop-blur-sm border-b border-stone-200">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
            {/* Left: Monochrome Wind mark + SmogShield */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#164E3B] text-white">
                <Wind className="h-4 w-4" />
              </div>
              <span className="text-base font-semibold tracking-tight text-stone-950">
                SmogShield
              </span>
            </Link>

            {/* Right: Subtle live status dot + AuthNav */}
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-1.5 text-xs text-stone-600">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="font-medium">Live AQI</span>
              </div>
              <AuthNav />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

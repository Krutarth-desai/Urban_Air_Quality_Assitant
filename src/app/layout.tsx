import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";
import { AuthNav } from "@/components/AuthNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmogShield — Urban Air Quality & Low-Emission Assistant",
  description:
    "Protect your family and community from severe winter smog with live hourly PM2.5 forecasts, budget-friendly IAQ hacks, and personalized low-emission routines powered by Gemini AI.",
  keywords: [
    "air quality",
    "winter smog",
    "PM2.5",
    "indoor air quality",
    "low emission",
    "urban smog",
    "AQI assistant",
    "Gemini AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500/30 selection:text-teal-200">
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-md shadow-teal-500/20 transition group-hover:scale-105">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                    SmogShield
                  </span>
                  <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                    Winter Smog Edition
                  </span>
                </div>
                <p className="hidden text-[11px] text-slate-400 sm:block">
                  Real-Time PM2.5 Routines, IAQ Hacks & Low-Emission Living
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300 md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Open-Meteo Feeds</span>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-300 sm:flex">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gemini 2.5 Flash</span>
              </div>
              <AuthNav />
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}

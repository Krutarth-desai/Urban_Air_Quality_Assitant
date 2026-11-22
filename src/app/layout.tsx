import type { Metadata } from "next";
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
        {children}
      </body>
    </html>
  );
}

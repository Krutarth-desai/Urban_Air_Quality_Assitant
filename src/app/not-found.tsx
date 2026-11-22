import React from "react";
import Link from "next/link";
import { Wind, ArrowLeft } from "lucide-react";

/**
 * Clean 404 page when a requested URL or station does not exist.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-stone-700 shadow-2xs">
        <Wind className="h-6 w-6 text-[#164E3B]" />
      </div>

      <h1 className="mt-4 text-xl font-bold tracking-tight text-stone-950 sm:text-2xl">
        Telemetry Station Not Found (404)
      </h1>

      <p className="mt-1.5 max-w-sm text-xs text-stone-600 sm:text-sm leading-relaxed">
        The requested atmospheric route or coordinate does not exist or has moved.
      </p>

      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#164E3B] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#113D2E] active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Telemetry Console</span>
        </Link>
      </div>
    </div>
  );
}

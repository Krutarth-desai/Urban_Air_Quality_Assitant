"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global App Router error boundary with recovery action.
 */
export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("[SmogShield Global Error Caught]:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 shadow-2xs">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-lg font-bold tracking-tight text-stone-950 sm:text-xl">
        Atmospheric Telemetry Sync Interrupted
      </h2>

      <p className="mt-1.5 max-w-md text-xs text-stone-600 sm:text-sm leading-relaxed">
        An unexpected error occurred while processing atmospheric telemetry or generating your mitigation plan.
      </p>

      {error.digest && (
        <span className="mt-2 font-mono text-[11px] text-stone-400">
          Ref ID: {error.digest}
        </span>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#164E3B] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#113D2E] active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-800 shadow-2xs transition hover:bg-stone-50"
        >
          <Home className="h-3.5 w-3.5 text-stone-500" />
          <span>Return to Console</span>
        </Link>
      </div>
    </div>
  );
}

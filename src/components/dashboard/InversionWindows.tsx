"use client";

import React from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";

interface InversionWindowsProps {
  safestWindow: string;
  peakSmogWindow: string;
}

/**
 * Callouts for optimal ventilation windows and peak winter smog trapping hours.
 */
export function InversionWindows({
  safestWindow,
  peakSmogWindow,
}: InversionWindowsProps) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <div className="flex items-start gap-2.5 rounded-lg border border-stone-200 bg-stone-50/50 p-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-600 font-mono">
            Safest Ventilation Window
          </span>
          <div className="text-xs font-semibold text-stone-900 truncate">
            {safestWindow}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-stone-200 bg-stone-50/50 p-2.5">
        <ShieldAlert className="h-4 w-4 shrink-0 text-red-700 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-600 font-mono">
            Peak Smog Window
          </span>
          <div className="text-xs font-semibold text-stone-900 truncate">
            {peakSmogWindow}
          </div>
        </div>
      </div>
    </div>
  );
}

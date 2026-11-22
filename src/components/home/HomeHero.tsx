import React from "react";
import { Wind } from "lucide-react";

/**
 * Editorial header section introducing SmogShield and winter inversion dynamics.
 */
export function HomeHero() {
  return (
    <section aria-label="Console Overview & Objective" className="border-b border-stone-200/90 bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="inline-flex items-center gap-2 rounded border border-stone-200 bg-stone-50 px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-stone-700">
          <Wind className="h-3 w-3 text-stone-700" aria-hidden="true" />
          <span>Atmospheric Health Console • Winter Inversion Edition</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl md:text-4xl">
          Calibrated Particulate Mitigation & Exposure Timing
        </h1>
        <p className="mt-2 max-w-3xl text-xs text-stone-600 sm:text-sm leading-relaxed">
          Time household ventilation to real hourly PM2.5 forecasts, safeguard developing or reactive airways with low-cost indoor containment, and discover measurable emission-reduction routines.
        </p>
      </div>
    </section>
  );
}

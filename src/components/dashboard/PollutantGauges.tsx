"use client";

import React from "react";
import type { AirQualityReport } from "@/types/smogshield";

interface PollutantGaugesProps {
  report: Pick<AirQualityReport, "pm25" | "pm10" | "no2" | "o3">;
}

/**
 * 4-card telemetry display for ambient atmospheric pollutants (PM2.5, PM10, NO2, O3).
 */
export function PollutantGauges({ report }: PollutantGaugesProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
          PM2.5 (Fine)
        </div>
        <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-stone-950">
          {report.pm25}
          <span className="text-xs font-normal text-stone-500 ml-1">µg/m³</span>
        </div>
        <div className="mt-0.5 text-[11px] text-stone-500">Limit: 15</div>
      </div>

      <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
          PM10 (Coarse)
        </div>
        <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-stone-950">
          {report.pm10}
          <span className="text-xs font-normal text-stone-500 ml-1">µg/m³</span>
        </div>
        <div className="mt-0.5 text-[11px] text-stone-500">Road soot</div>
      </div>

      <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
          NO2 (Dioxide)
        </div>
        <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-stone-950">
          {report.no2}
          <span className="text-xs font-normal text-stone-500 ml-1">µg/m³</span>
        </div>
        <div className="mt-0.5 text-[11px] text-stone-500">Exhaust</div>
      </div>

      <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
          O3 (Ozone)
        </div>
        <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-stone-950">
          {report.o3}
          <span className="text-xs font-normal text-stone-500 ml-1">µg/m³</span>
        </div>
        <div className="mt-0.5 text-[11px] text-stone-500">Oxidant</div>
      </div>
    </div>
  );
}

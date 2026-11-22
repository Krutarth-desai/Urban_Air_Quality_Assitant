"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { IMPACT_CONSTANTS } from "@/lib/aqi-utils";

interface ImpactMeterProps {
  totalPm25Reduction: number;
  totalCo2Saved: number;
  activeCount: number;
  totalCount: number;
}

/**
 * Visual progress bars quantifying real-time personal inhaled PM2.5 reduction
 * and weekly community CO2 emissions prevented by active commitments.
 */
export function ImpactMeter({
  totalPm25Reduction,
  totalCo2Saved,
  activeCount,
  totalCount,
}: ImpactMeterProps) {
  const gasolineKmOffset = Math.round(
    totalCo2Saved * IMPACT_CONSTANTS.KM_PER_KG_CO2_OFFSET
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-stone-200/60">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-stone-700" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800 font-mono">
            Live Direct Impact Telemetry
          </h4>
        </div>
        <span className="font-mono text-xs text-stone-500">
          {activeCount} of {totalCount} commitments active
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* PM2.5 Inhalation Exposure Reduction */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-700">
              Inhaled PM2.5 Reduction
            </span>
            <span className="font-mono font-semibold tabular-nums text-emerald-800 text-sm">
              ~{totalPm25Reduction}%
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              style={{ width: `${Math.min(totalPm25Reduction, 100)}%` }}
              className="h-full rounded-full bg-[#164E3B] transition-all duration-300"
            />
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            Calculated reduction in fine soot particulate entering lungs.
          </div>
        </div>

        {/* Community CO2 Reduction */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-700">
              Community CO2 Avoidance
            </span>
            <span className="font-mono font-semibold tabular-nums text-stone-900 text-sm">
              {totalCo2Saved.toFixed(1)} kg / wk
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              style={{
                width: `${Math.min(
                  (totalCo2Saved / IMPACT_CONSTANTS.WEEKLY_CO2_BAR_MAX_KG) * 100,
                  100
                )}%`,
              }}
              className="h-full rounded-full bg-stone-800 transition-all duration-300"
            />
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            Equivalent to ~{gasolineKmOffset} km of gasoline combustion eliminated.
          </div>
        </div>
      </div>
    </div>
  );
}

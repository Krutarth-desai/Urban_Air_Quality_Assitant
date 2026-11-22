"use client";

import React from "react";
import { TrendingUp, Users } from "lucide-react";
import { IMPACT_CONSTANTS, calculateCollectiveImpact } from "@/lib/aqi-utils";

interface ImpactMeterProps {
  totalPm25Reduction: number;
  totalCo2Saved: number;
  activeCount: number;
  totalCount: number;
  cityName?: string;
}

/**
 * Visual progress bars quantifying real-time personal inhaled PM2.5 reduction
 * and weekly community CO2 emissions prevented by active commitments,
 * alongside a scalable 50-household neighborhood collective impact readout.
 */
export function ImpactMeter({
  totalPm25Reduction,
  totalCo2Saved,
  activeCount,
  totalCount,
  cityName = "your community",
}: ImpactMeterProps) {
  const gasolineKmOffset = Math.round(
    totalCo2Saved * IMPACT_CONSTANTS.KM_PER_KG_CO2_OFFSET
  );

  const collective = calculateCollectiveImpact(totalCo2Saved, 50);

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-4" aria-live="polite">
      {/* Top Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-stone-200/60">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-stone-700" aria-hidden="true" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800 font-mono">
            Direct Health & Emission Impact Telemetry
          </h3>
        </div>
        <span className="font-mono text-xs text-stone-600">
          {activeCount} of {totalCount} commitments active
        </span>
      </div>

      {/* Primary Individual Household Impact Meters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* PM2.5 Inhalation Exposure Reduction */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-800">
              Personal Inhaled PM2.5 Reduction
            </span>
            <span className="font-mono font-semibold tabular-nums text-emerald-800 text-sm">
              ~{totalPm25Reduction}%
            </span>
          </div>
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200"
            role="progressbar"
            aria-valuenow={Math.min(totalPm25Reduction, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Personal Inhaled PM2.5 Exposure Reduction Percentage"
          >
            <div
              style={{ width: `${Math.min(totalPm25Reduction, 100)}%` }}
              className="h-full rounded-full bg-[#164E3B] transition-all duration-300"
            />
          </div>
          <div className="mt-1 text-[11px] text-stone-600">
            Calculated reduction in toxic fine soot particulate entering respiratory airways.
          </div>
        </div>

        {/* Community CO2 Reduction */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-800">
              Household CO2 Avoidance
            </span>
            <span className="font-mono font-semibold tabular-nums text-stone-900 text-sm">
              {totalCo2Saved.toFixed(1)} kg / wk
            </span>
          </div>
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200"
            role="progressbar"
            aria-valuenow={Math.min(
              Math.round(
                (totalCo2Saved / IMPACT_CONSTANTS.WEEKLY_CO2_BAR_MAX_KG) * 100
              ),
              100
            )}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Household CO2 Avoidance Progress"
          >
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
          <div className="mt-1 text-[11px] text-stone-600">
            Equivalent to ~{gasolineKmOffset} km of single-occupancy driving eliminated.
          </div>
        </div>
      </div>

      {/* Community Multiplier Banner: "If 50 families in [City] adopt this" */}
      <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-stone-900 font-semibold text-xs">
          <Users className="h-3.5 w-3.5 text-[#164E3B]" aria-hidden="true" />
          <span>Neighborhood Multiplier: If 50 families in {cityName} adopt this routine</span>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
          <div className="rounded-md border border-stone-100 bg-stone-50 p-2">
            <span className="text-[10px] font-mono uppercase text-stone-600">
              Weekly CO2 Avoided
            </span>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-stone-900">
              {collective.collectiveCo2Kg.toFixed(0)} kg / wk
            </div>
            <span className="text-[10px] text-stone-600">
              ~{(collective.collectiveCo2Kg * 52 / 1000).toFixed(1)} tons / year
            </span>
          </div>

          <div className="rounded-md border border-stone-100 bg-stone-50 p-2">
            <span className="text-[10px] font-mono uppercase text-stone-600">
              Vehicle Distance Offset
            </span>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-stone-900">
              {collective.vehicleKmEliminated.toLocaleString()} km / wk
            </div>
            <span className="text-[10px] text-stone-600">
              Combustion traffic eliminated
            </span>
          </div>

          <div className="rounded-md border border-emerald-100 bg-emerald-50/50 p-2">
            <span className="text-[10px] font-mono uppercase text-emerald-950 font-semibold">
              Soot Particulate Prevented
            </span>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-emerald-900">
              ~{collective.particulatePreventedGrams.toLocaleString()} g / wk
            </div>
            <span className="text-[10px] text-emerald-800">
              Kept out of neighborhood lungs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

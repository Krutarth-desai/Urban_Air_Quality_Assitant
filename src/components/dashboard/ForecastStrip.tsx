"use client";

import React, { useState } from "react";
import { Clock } from "lucide-react";
import { getBarColor } from "@/lib/aqi-utils";
import type { HourlyPoint } from "@/types/smogshield";

interface ForecastStripProps {
  forecast: HourlyPoint[];
}

/**
 * 24-hour PM2.5 hourly bar chart with interactive hover inspect.
 */
export function ForecastStrip({ forecast }: ForecastStripProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const displayPoints = forecast.slice(0, 24);
  const maxForecastPm25 = displayPoints.length
    ? Math.max(...displayPoints.map((p) => p.pm25), 35)
    : 50;

  return (
    <div className="mt-5 pt-4 border-t border-stone-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-600 font-mono">
          <Clock className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
          <span>24-Hour PM2.5 Forecast Telemetry (µg/m³)</span>
        </div>
        {hoveredIdx !== null && displayPoints[hoveredIdx] && (
          <div className="font-mono text-xs font-semibold tabular-nums text-stone-900" aria-live="polite">
            {displayPoints[hoveredIdx].hourLabel}: {displayPoints[hoveredIdx].pm25} µg/m³ (AQI{" "}
            {displayPoints[hoveredIdx].usAqi})
          </div>
        )}
      </div>

      <div
        className="mt-3 flex h-20 items-end gap-1 sm:gap-1.5"
        role="img"
        aria-label="24-hour PM2.5 hourly forecast bar graph"
      >
        {displayPoints.map((pt, idx) => {
          const heightPct = Math.max(
            Math.round((pt.pm25 / maxForecastPm25) * 100),
            8
          );
          const isHovered = hoveredIdx === idx;
          const barColor = getBarColor(pt.pm25);

          return (
            <div
              key={pt.time}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
            >
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-xs transition-all duration-100 ${barColor} ${
                  isHovered ? "ring-1 ring-stone-950 scale-105" : ""
                }`}
              />

              <div className="pointer-events-none absolute -top-8 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded border border-stone-800 bg-stone-950 px-2 py-0.5 font-mono text-[10px] text-white shadow-sm group-hover:block">
                {pt.hourLabel}: {pt.pm25} µg/m³
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] font-mono text-stone-600">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

import React from "react";
import { Wind, Globe } from "lucide-react";

/**
 * Clean editorial footer with data sources, standards attribution, and medical disclaimers.
 */
export function HomeFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white py-8 text-xs text-stone-500">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-100">
          <div className="flex items-center gap-2 text-stone-900 font-semibold">
            <Wind className="h-4 w-4 text-[#164E3B]" />
            <span>SmogShield</span>
            <span className="text-stone-300">|</span>
            <span className="text-xs font-normal text-stone-500">
              Urban Air Quality & Low-Emission Lifestyle Assistant
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-stone-400" />
              <span>Open-Meteo Atmospheric Models</span>
            </span>
            <span>•</span>
            <span>WHO 2021 Particulate Guidelines</span>
          </div>
        </div>

        <div className="mt-4 text-[11px] text-stone-400 leading-relaxed">
          <strong className="text-stone-600">Clinical & Environmental Notice: </strong>
          SmogShield provides environmental exposure reduction schedules and building science guidance based on published aerosol physics. It does not provide medical diagnosis, clinical treatment, or replace certified healthcare advice. Individuals exhibiting acute hypoxia, severe asthma exacerbations, or chest pain must access emergency medical care immediately.
        </div>
      </div>
    </footer>
  );
}

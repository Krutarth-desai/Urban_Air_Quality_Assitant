import React from "react";
import { Info } from "lucide-react";

/**
 * Scientific card explaining nocturnal thermal inversion physics.
 */
export function ThermalInversionCard() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 text-xs text-stone-600 leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-1.5 font-semibold text-stone-900 mb-1.5">
        <Info className="h-4 w-4 text-stone-700" />
        <span>Thermal Inversion Dynamics</span>
      </div>
      <p>
        During cold winter nights, nocturnal radiative surface cooling traps fine aerosols (PM2.5) within a shallow atmospheric boundary layer below 100 meters. SmogShield pinpoints the solar heating breakthrough window to safely schedule indoor air exchanges.
      </p>
    </div>
  );
}

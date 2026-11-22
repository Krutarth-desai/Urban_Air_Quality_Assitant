"use client";

import React from "react";
import { Car, Bike, Bus, Footprints, Laptop } from "lucide-react";
import type { CommuteMode } from "@/types/smogshield";

interface CommuteSelectorProps {
  selectedCommute: CommuteMode;
  onSelect: (mode: CommuteMode) => void;
}

const COMMUTE_OPTIONS: {
  id: CommuteMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "private_car", label: "Car", icon: Car },
  { id: "two_wheeler", label: "Motorcycle", icon: Bike },
  { id: "public_transit", label: "Transit", icon: Bus },
  { id: "walk_cycle", label: "Bicycle / Walk", icon: Footprints },
  { id: "work_from_home", label: "WFH", icon: Laptop },
];

/**
 * 5-column button grid for choosing primary commute mode.
 */
export function CommuteSelector({
  selectedCommute,
  onSelect,
}: CommuteSelectorProps) {
  return (
    <div>
      <span className="text-[11px] font-medium uppercase tracking-wider text-stone-600 font-mono">
        2. Primary Commute
      </span>
      <div
        className="mt-2 grid grid-cols-5 gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200/80"
        role="group"
        aria-label="Primary commute mode"
      >
        {COMMUTE_OPTIONS.map((mode) => {
          const selected = selectedCommute === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              aria-pressed={selected}
              aria-label={mode.label}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-md text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                selected
                  ? "bg-white text-stone-950 shadow-2xs font-semibold border border-stone-200/60"
                  : "text-stone-700 hover:text-stone-950"
              }`}
              title={mode.label}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-[10px] truncate max-w-full">
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

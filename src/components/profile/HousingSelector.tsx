"use client";

import React from "react";
import { Building2, Building, Home } from "lucide-react";
import type { CookingFuel, HomeType } from "@/types/smogshield";

interface HousingSelectorProps {
  homeType: HomeType;
  hasAirPurifier: boolean;
  cookingFuel: CookingFuel;
  onUpdateHomeType: (type: HomeType) => void;
  onUpdatePurifier: (hasPurifier: boolean) => void;
  onUpdateFuel: (fuel: CookingFuel) => void;
}

const HOME_OPTIONS: {
  id: HomeType;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "apartment_highrise",
    label: "High-Rise Apartment",
    sub: "Upper floor boundary layer",
    icon: Building2,
  },
  {
    id: "dense_urban_flat",
    label: "Dense Urban Flat",
    sub: "Street-level canyon effect",
    icon: Building,
  },
  {
    id: "independent_house",
    label: "Independent House",
    sub: "Perimeter air infiltration",
    icon: Home,
  },
];

const FUEL_OPTIONS: {
  id: CookingFuel;
  label: string;
}[] = [
  { id: "lpg_gas", label: "LPG Gas" },
  { id: "electric_induction", label: "Electric" },
  { id: "biomass_solid", label: "Solid Fuel" },
];

/**
 * Housing structure, indoor air purifier availability, and cooking fuel selectors.
 */
export function HousingSelector({
  homeType,
  hasAirPurifier,
  cookingFuel,
  onUpdateHomeType,
  onUpdatePurifier,
  onUpdateFuel,
}: HousingSelectorProps) {
  return (
    <>
      {/* 3. Home Type */}
      <div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-stone-600 font-mono">
          3. Structure & Boundary Layer
        </span>
        <div className="mt-2 space-y-1.5" role="group" aria-label="Housing building structure">
          {HOME_OPTIONS.map((home) => {
            const selected = homeType === home.id;
            const Icon = home.icon;
            return (
              <button
                key={home.id}
                type="button"
                onClick={() => onUpdateHomeType(home.id)}
                aria-pressed={selected}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                  selected
                    ? "border-stone-900 bg-stone-50 text-stone-950 ring-1 ring-stone-900/10"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    selected ? "text-stone-950" : "text-stone-500"
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{home.label}</div>
                  <div className="text-[10px] text-stone-600">{home.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. HEPA Air Purifier & Cooking Fuel */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-600 font-mono">
            HEPA Purifier
          </span>
          <div
            className="mt-1.5 grid grid-cols-2 gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80"
            role="group"
            aria-label="HEPA air purifier availability"
          >
            <button
              type="button"
              onClick={() => onUpdatePurifier(true)}
              aria-pressed={hasAirPurifier}
              className={`py-1 text-center rounded text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                hasAirPurifier
                  ? "bg-white text-stone-950 font-semibold shadow-2xs"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onUpdatePurifier(false)}
              aria-pressed={!hasAirPurifier}
              className={`py-1 text-center rounded text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                !hasAirPurifier
                  ? "bg-white text-stone-950 font-semibold shadow-2xs"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              No (DIY)
            </button>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-600 font-mono">
            Cooking Fuel
          </span>
          <div
            className="mt-1.5 grid grid-cols-3 gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80"
            role="group"
            aria-label="Primary cooking fuel"
          >
            {FUEL_OPTIONS.map((f) => {
              const selected = cookingFuel === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onUpdateFuel(f.id)}
                  aria-pressed={selected}
                  aria-label={f.label}
                  className={`py-1 text-center rounded text-[10px] transition truncate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                    selected
                      ? "bg-white text-stone-950 font-semibold shadow-2xs"
                      : "text-stone-700 hover:text-stone-950"
                  }`}
                  title={f.label}
                >
                  {f.label.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

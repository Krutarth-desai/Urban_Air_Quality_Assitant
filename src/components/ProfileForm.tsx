"use client";

import React, { useEffect } from "react";
import {
  Loader2,
  Users,
  Baby,
  HeartHandshake,
  Activity,
  Heart,
  HardHat,
  PawPrint,
  Car,
  Bike,
  Bus,
  Footprints,
  Laptop,
  Building2,
  Home,
  Building,
  Flame,
  Zap,
  Check,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { HouseholdProfile } from "@/lib/schemas";

interface ProfileFormProps {
  profile: HouseholdProfile;
  onChange: (updated: HouseholdProfile) => void;
  onSubmit: () => void;
  loading: boolean;
}

const STORAGE_KEY = "smogshield_household_profile";

const MEMBER_OPTIONS: {
  id: HouseholdProfile["householdMembers"][number];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    id: "infants_kids",
    label: "Infants / Children",
    icon: Baby,
    description: "Developing airway, higher ventilation rate",
  },
  {
    id: "elderly",
    label: "Elderly (65+)",
    icon: HeartHandshake,
    description: "Elevated cardiovascular sensitivity",
  },
  {
    id: "asthma_respiratory",
    label: "Asthma / Allergies",
    icon: Activity,
    description: "Bronchial reactivity to fine soot",
  },
  {
    id: "pregnant",
    label: "Pregnant Members",
    icon: Heart,
    description: "Placental barrier protection priority",
  },
  {
    id: "outdoor_workers",
    label: "Outdoor Commuters",
    icon: HardHat,
    description: "Prolonged ambient peak exposure",
  },
  {
    id: "pets",
    label: "Household Pets",
    icon: PawPrint,
    description: "Ground boundary particulate zone",
  },
  {
    id: "general_adults",
    label: "General Adults",
    icon: Users,
    description: "Standard physiological threshold",
  },
];

const COMMUTE_OPTIONS: {
  id: HouseholdProfile["commuteMode"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "private_car", label: "Car", icon: Car },
  { id: "two_wheeler", label: "Motorcycle", icon: Bike },
  { id: "public_transit", label: "Transit", icon: Bus },
  { id: "walk_cycle", label: "Bicycle / Walk", icon: Footprints },
  { id: "work_from_home", label: "WFH", icon: Laptop },
];

const HOME_OPTIONS: {
  id: HouseholdProfile["homeType"];
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
  id: HouseholdProfile["cookingFuel"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "lpg_gas", label: "LPG Gas", icon: Flame },
  { id: "electric_induction", label: "Electric", icon: Zap },
  { id: "biomass_solid", label: "Solid Fuel", icon: Flame },
];

export function ProfileForm({
  profile,
  onChange,
  onSubmit,
  loading,
}: ProfileFormProps) {
  // Restore persisted profile on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<HouseholdProfile>;
        if (parsed.householdMembers && parsed.commuteMode) {
          onChange({
            ...profile,
            ...parsed,
            city: profile.city || parsed.city || "New Delhi",
            latitude: profile.latitude || parsed.latitude || 28.6139,
            longitude: profile.longitude || parsed.longitude || 77.209,
          });
        }
      }
    } catch (e) {
      console.warn("Could not read stored profile:", e);
    }

    // Check if user has a cloud-synced profile in Supabase
    fetch("/api/profile")
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as {
            profile?: {
              city: string;
              has_kids: boolean;
              has_seniors: boolean;
              has_respiratory_condition: boolean;
              has_hepa_purifier: boolean;
              commute_mode: HouseholdProfile["commuteMode"];
            };
          };
          if (data.profile) {
            const members: HouseholdProfile["householdMembers"] = [];
            if (data.profile.has_kids) members.push("infants_kids");
            if (data.profile.has_seniors) members.push("elderly");
            if (data.profile.has_respiratory_condition)
              members.push("asthma_respiratory");
            if (members.length === 0) members.push("general_adults");

            const updated: HouseholdProfile = {
              ...profile,
              city: data.profile.city || profile.city,
              hasAirPurifier: Boolean(data.profile.has_hepa_purifier),
              commuteMode: data.profile.commute_mode || profile.commuteMode,
              householdMembers: members,
            };
            onChange(updated);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {}
          }
        }
      })
      .catch(() => {
        // Guest mode fallback
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMemberToggle = (
    id: HouseholdProfile["householdMembers"][number]
  ) => {
    const exists = profile.householdMembers.includes(id);
    let next: HouseholdProfile["householdMembers"];

    if (exists) {
      if (profile.householdMembers.length <= 1) return; // Keep at least 1
      next = profile.householdMembers.filter((m) => m !== id);
    } else {
      next = [...profile.householdMembers, id];
    }

    const updated: HouseholdProfile = { ...profile, householdMembers: next };
    onChange(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleUpdate = <K extends keyof HouseholdProfile>(
    key: K,
    val: HouseholdProfile[K]
  ) => {
    const updated: HouseholdProfile = { ...profile, [key]: val };
    onChange(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleGenerateClick = () => {
    // If authenticated, asynchronously persist profile updates to Supabase
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: profile.city,
        has_kids: profile.householdMembers.includes("infants_kids"),
        has_seniors: profile.householdMembers.includes("elderly"),
        has_respiratory_condition:
          profile.householdMembers.includes("asthma_respiratory"),
        has_hepa_purifier: profile.hasAirPurifier,
        commute_mode: profile.commuteMode,
      }),
    }).catch(() => {
      // Guest mode - silently ignore
    });

    onSubmit();
  };

  return (
    <div className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
        <SlidersHorizontal className="h-4 w-4 text-stone-800" />
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-stone-950">
            Household Parameters
          </h3>
          <p className="text-[11px] text-stone-500">
            Calibrate particulate mitigation to resident vulnerability.
          </p>
        </div>
      </div>

      {/* 1. Household Members / Vulnerabilities */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-stone-500 font-mono">
          1. Resident Vulnerabilities
        </label>
        <div className="mt-2 space-y-1.5">
          {MEMBER_OPTIONS.map((item) => {
            const selected = profile.householdMembers.includes(item.id);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMemberToggle(item.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                  selected
                    ? "border-stone-900 bg-stone-50 text-stone-950 ring-1 ring-stone-900/10"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      selected ? "text-stone-950" : "text-stone-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    selected
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-300 bg-white"
                  }`}
                >
                  {selected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Commute Mode */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-stone-500 font-mono">
          2. Primary Commute
        </label>
        <div className="mt-2 grid grid-cols-5 gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200/80">
          {COMMUTE_OPTIONS.map((mode) => {
            const selected = profile.commuteMode === mode.id;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleUpdate("commuteMode", mode.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-md text-center transition ${
                  selected
                    ? "bg-white text-stone-950 shadow-2xs font-semibold border border-stone-200/60"
                    : "text-stone-600 hover:text-stone-950"
                }`}
                title={mode.label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[10px] truncate max-w-full">
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Home Type */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-stone-500 font-mono">
          3. Structure & Boundary Layer
        </label>
        <div className="mt-2 space-y-1.5">
          {HOME_OPTIONS.map((home) => {
            const selected = profile.homeType === home.id;
            const Icon = home.icon;
            return (
              <button
                key={home.id}
                type="button"
                onClick={() => handleUpdate("homeType", home.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${
                  selected
                    ? "border-stone-900 bg-stone-50 text-stone-950 ring-1 ring-stone-900/10"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    selected ? "text-stone-950" : "text-stone-400"
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{home.label}</div>
                  <div className="text-[10px] text-stone-500">{home.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. HEPA Air Purifier & Cooking Fuel */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
            HEPA Purifier
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80">
            <button
              type="button"
              onClick={() => handleUpdate("hasAirPurifier", true)}
              className={`py-1 text-center rounded text-xs transition ${
                profile.hasAirPurifier
                  ? "bg-white text-stone-950 font-semibold shadow-2xs"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleUpdate("hasAirPurifier", false)}
              className={`py-1 text-center rounded text-xs transition ${
                !profile.hasAirPurifier
                  ? "bg-white text-stone-950 font-semibold shadow-2xs"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              No (DIY)
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
            Cooking Fuel
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80">
            {FUEL_OPTIONS.map((f) => {
              const selected = profile.cookingFuel === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleUpdate("cookingFuel", f.id)}
                  className={`py-1 text-center rounded text-[10px] transition truncate ${
                    selected
                      ? "bg-white text-stone-950 font-semibold shadow-2xs"
                      : "text-stone-600 hover:text-stone-950"
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

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#164E3B] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#113D2E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calibrating Forecast...</span>
            </>
          ) : (
            <>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Update Routine & Forecast</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

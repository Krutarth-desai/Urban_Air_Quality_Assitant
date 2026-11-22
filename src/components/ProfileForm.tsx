"use client";

import React, { useEffect } from "react";
import {
  Sparkles,
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
  CheckCircle2,
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
    description: "Developing lungs, higher breath rate",
  },
  {
    id: "elderly",
    label: "Elderly (65+)",
    icon: HeartHandshake,
    description: "Higher cardiovascular sensitivity",
  },
  {
    id: "asthma_respiratory",
    label: "Asthma / Allergies",
    icon: Activity,
    description: "Acute airway reactivity to fine soot",
  },
  {
    id: "pregnant",
    label: "Pregnant Members",
    icon: Heart,
    description: "Placental barrier protection needed",
  },
  {
    id: "outdoor_workers",
    label: "Outdoor Commuters",
    icon: HardHat,
    description: "Extended ambient smog exposure",
  },
  {
    id: "pets",
    label: "Household Pets",
    icon: PawPrint,
    description: "Ground-level breathing zone",
  },
  {
    id: "general_adults",
    label: "General Adults",
    icon: Users,
    description: "Standard baseline sensitivity",
  },
];

const COMMUTE_OPTIONS: {
  id: HouseholdProfile["commuteMode"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "private_car", label: "Private Car", icon: Car },
  { id: "two_wheeler", label: "Motorcycle / Scooter", icon: Bike },
  { id: "public_transit", label: "Bus / Metro", icon: Bus },
  { id: "walk_cycle", label: "Walk / Bicycle", icon: Footprints },
  { id: "work_from_home", label: "Work From Home", icon: Laptop },
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
    sub: "Better wind flow, higher floor draft",
    icon: Building2,
  },
  {
    id: "dense_urban_flat",
    label: "Dense Urban Flat",
    sub: "Street-level canyon effect & street dust",
    icon: Building,
  },
  {
    id: "independent_house",
    label: "Independent House",
    sub: "Ground boundary layer, perimeter infiltration",
    icon: Home,
  },
];

const FUEL_OPTIONS: {
  id: HouseholdProfile["cookingFuel"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "lpg_gas", label: "LPG Gas", icon: Flame },
  { id: "electric_induction", label: "Induction / Electric", icon: Zap },
  { id: "biomass_solid", label: "Wood / Coal / Biomass", icon: Flame },
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm sm:p-7">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-teal-500/20 p-2 text-teal-300">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            Household Profile & Vulnerability Context
          </h3>
          <p className="text-xs text-slate-400">
            Tailor routines, indoor hacks, and low-emission choices to who lives with you.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* 1. Household Members (Multi-select) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            1. Who is in your household? (Select all that apply)
          </label>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {MEMBER_OPTIONS.map((item) => {
              const selected = profile.householdMembers.includes(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMemberToggle(item.id)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-teal-500/80 bg-teal-500/15 shadow-sm shadow-teal-500/10"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  <div
                    className={`mt-0.5 rounded-lg p-1.5 ${
                      selected
                        ? "bg-teal-500 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          selected ? "text-teal-200" : "text-slate-200"
                        }`}
                      >
                        {item.label}
                      </span>
                      {selected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400 leading-tight">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Commute Mode */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            2. Primary Commute Mode
          </label>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {COMMUTE_OPTIONS.map((mode) => {
              const selected = profile.commuteMode === mode.id;
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleUpdate("commuteMode", mode.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition ${
                    selected
                      ? "border-teal-500 bg-teal-500/15 text-teal-200"
                      : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Home Structure & HEPA Purifier in Two Columns */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Home Type */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              3. Home Type
            </label>
            <div className="mt-2.5 space-y-2">
              {HOME_OPTIONS.map((home) => {
                const selected = profile.homeType === home.id;
                const Icon = home.icon;
                return (
                  <button
                    key={home.id}
                    type="button"
                    onClick={() => handleUpdate("homeType", home.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-teal-500 bg-teal-500/15 text-white"
                        : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-teal-400" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold">{home.label}</div>
                      <div className="text-[11px] text-slate-400">{home.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Purifier & Fuel */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                4. HEPA Air Purifier at Home?
              </label>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdate("hasAirPurifier", true)}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                    profile.hasAirPurifier
                      ? "border-teal-500 bg-teal-500/20 text-teal-200"
                      : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-teal-400" />
                  <span>Yes, HEPA Purifier</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate("hasAirPurifier", false)}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                    !profile.hasAirPurifier
                      ? "border-amber-500 bg-amber-500/20 text-amber-200"
                      : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span>No (Need DIY Hacks)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                5. Cooking Fuel
              </label>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {FUEL_OPTIONS.map((f) => {
                  const selected = profile.cookingFuel === f.id;
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleUpdate("cookingFuel", f.id)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition ${
                        selected
                          ? "border-teal-500 bg-teal-500/15 text-teal-200"
                          : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px] font-medium">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGenerateClick}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/25 transition duration-200 hover:from-teal-400 hover:via-emerald-400 hover:to-teal-500 hover:shadow-teal-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating Your AI Smog Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate My Personalized Smog Plan</span>
              </>
            )}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Powered by Gemini with live hourly PM2.5 forecasts & evidence-based mitigation science
          </p>
        </div>
      </div>
    </div>
  );
}

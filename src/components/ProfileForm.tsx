"use client";

import React, { useEffect } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { VulnerabilitySelector } from "./profile/VulnerabilitySelector";
import { CommuteSelector } from "./profile/CommuteSelector";
import { HousingSelector } from "./profile/HousingSelector";
import type { HouseholdMemberType, HouseholdProfile } from "@/types/smogshield";

interface ProfileFormProps {
  profile: HouseholdProfile;
  onChange: (updated: HouseholdProfile) => void;
  onSubmit: () => void;
  loading: boolean;
}

const STORAGE_KEY = "smogshield_household_profile";

/**
 * Controller form for configuring household vulnerability and exposure parameters.
 */
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

  const handleMemberToggle = (id: HouseholdMemberType) => {
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
    <div
      className="rounded-xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-5"
      aria-busy={loading}
    >
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
        <SlidersHorizontal className="h-4 w-4 text-stone-800" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-stone-950">
            Household Parameters
          </h2>
          <p className="text-[11px] text-stone-600">
            Calibrate particulate mitigation to resident vulnerability.
          </p>
        </div>
      </div>

      {/* 1. Vulnerabilities */}
      <VulnerabilitySelector
        selectedMembers={profile.householdMembers}
        onToggle={handleMemberToggle}
      />

      {/* 2. Commute Mode */}
      <CommuteSelector
        selectedCommute={profile.commuteMode}
        onSelect={(mode) => handleUpdate("commuteMode", mode)}
      />

      {/* 3. Housing, HEPA & Fuel */}
      <HousingSelector
        homeType={profile.homeType}
        hasAirPurifier={profile.hasAirPurifier}
        cookingFuel={profile.cookingFuel}
        onUpdateHomeType={(type) => handleUpdate("homeType", type)}
        onUpdatePurifier={(hasPurifier) =>
          handleUpdate("hasAirPurifier", hasPurifier)
        }
        onUpdateFuel={(fuel) => handleUpdate("cookingFuel", fuel)}
      />

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={loading}
          aria-busy={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#164E3B] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#113D2E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Calibrating Forecast...</span>
            </>
          ) : (
            <>
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Update Routine & Forecast</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

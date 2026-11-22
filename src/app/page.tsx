"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, SlidersHorizontal } from "lucide-react";
import { AqiDashboard } from "@/components/AqiDashboard";
import { ProfileForm } from "@/components/ProfileForm";
import { ActionPlanView } from "@/components/ActionPlanView";
import { SmogCoachChat } from "@/components/SmogCoachChat";
import { HomeHero } from "@/components/home/HomeHero";
import { ThermalInversionCard } from "@/components/home/ThermalInversionCard";
import { HomeFooter } from "@/components/home/HomeFooter";
import type {
  AirQualityReport,
  CityLocation,
  GeneratedActionPlan,
  HouseholdProfile,
} from "@/types/smogshield";

const DEFAULT_CITY: CityLocation = {
  name: "New Delhi",
  country: "India",
  admin1: "Delhi",
  latitude: 28.6139,
  longitude: 77.209,
};

const DEFAULT_PROFILE: HouseholdProfile = {
  city: "New Delhi",
  latitude: 28.6139,
  longitude: 77.209,
  householdMembers: ["infants_kids", "asthma_respiratory"],
  commuteMode: "public_transit",
  homeType: "apartment_highrise",
  hasAirPurifier: false,
  cookingFuel: "lpg_gas",
};

/**
 * Root Telemetry Console Page of SmogShield.
 */
export default function Home() {
  const [selectedCity, setSelectedCity] = useState<CityLocation>(DEFAULT_CITY);
  const [aqiReport, setAqiReport] = useState<AirQualityReport | null>(null);
  const [loadingAqi, setLoadingAqi] = useState<boolean>(true);
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [plan, setPlan] = useState<GeneratedActionPlan | null>(null);
  const [planSource, setPlanSource] = useState<"gemini" | "fallback">("gemini");
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const planSectionRef = useRef<HTMLDivElement>(null);

  // Fetch AQI for a given coordinate
  const loadAqiData = useCallback(async (lat: number, lon: number) => {
    setLoadingAqi(true);
    try {
      const res = await fetch(`/api/aqi?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = (await res.json()) as { report?: AirQualityReport };
        if (data.report) {
          setAqiReport(data.report);
        }
      }
    } catch (err) {
      console.error("Failed to fetch air quality:", err);
    } finally {
      setLoadingAqi(false);
    }
  }, []);

  // Default load on initial mount (New Delhi)
  useEffect(() => {
    let active = true;
    async function initAqi() {
      try {
        const res = await fetch(
          `/api/aqi?lat=${DEFAULT_CITY.latitude}&lon=${DEFAULT_CITY.longitude}`
        );
        if (res.ok && active) {
          const data = (await res.json()) as { report?: AirQualityReport };
          if (data.report) {
            setAqiReport(data.report);
          }
        }
      } catch (err) {
        console.error("Failed to load initial air quality:", err);
      } finally {
        if (active) {
          setLoadingAqi(false);
        }
      }
    }
    initAqi();
    return () => {
      active = false;
    };
  }, []);

  // City selection handler
  const handleSelectCity = (city: CityLocation) => {
    setSelectedCity(city);
    setProfile((prev) => ({
      ...prev,
      city: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
    }));
    loadAqiData(city.latitude, city.longitude);
  };

  // Browser Geolocation handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingAqi(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const localCity: CityLocation = {
          name: "Local Telemetry Station",
          country: "Current Coordinates",
          latitude: lat,
          longitude: lon,
        };
        setSelectedCity(localCity);
        setProfile((prev) => ({
          ...prev,
          city: "Local Telemetry Station",
          latitude: lat,
          longitude: lon,
        }));
        await loadAqiData(lat, lon);
      },
      (err) => {
        console.warn("Geolocation denied or unavailable:", err);
        setLoadingAqi(false);
        alert("Unable to retrieve location. Please search for your city above.");
      },
      { timeout: 8000 }
    );
  };

  // Generate Personalized Smog Plan
  const handleGeneratePlan = async () => {
    if (!aqiReport) {
      alert("Please wait for telemetry data to load before generating a plan.");
      return;
    }

    setLoadingPlan(true);
    setPlanError(null);

    const payload = {
      profile: {
        ...profile,
        city: selectedCity.name,
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
      },
      aqiData: {
        usAqi: aqiReport.usAqi,
        pm25: aqiReport.pm25,
        pm10: aqiReport.pm10,
        no2: aqiReport.no2,
        o3: aqiReport.o3,
        category: aqiReport.category,
        safestWindow: aqiReport.safestWindow,
        peakSmogWindow: aqiReport.peakSmogWindow,
      },
    };

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = (await res.json()) as { error?: string };
        throw new Error(errJson.error || "Failed to generate plan");
      }

      const data = (await res.json()) as {
        plan: GeneratedActionPlan;
        source: "gemini" | "fallback";
      };
      setPlan(data.plan);
      setPlanSource(data.source);

      // Smooth scroll to generated plan
      setTimeout(() => {
        planSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (err: unknown) {
      console.error("Plan generation error:", err);
      const msg = err instanceof Error ? err.message : "Error generating plan";
      setPlanError(msg);
    } finally {
      setLoadingPlan(false);
    }
  };

  const householdSummary = `${profile.householdMembers.join(", ")} | Commute: ${
    profile.commuteMode
  } | Home: ${profile.homeType} | Purifier: ${
    profile.hasAirPurifier ? "Yes" : "No"
  }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F6F3] text-stone-950">
      {/* Editorial Page Header */}
      <HomeHero />

      {/* Main Workspace (12 cols) */}
      <main className="mx-auto max-w-6xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* Row 1: Full-width Air Quality Telemetry Bar */}
        <section aria-label="Live Air Quality Telemetry Bar">
          <AqiDashboard
            cityName={selectedCity.name}
            report={aqiReport}
            loading={loadingAqi}
            onSelectCity={handleSelectCity}
            onUseMyLocation={handleUseMyLocation}
          />
        </section>

        {/* Row 2: 2-Column Asymmetric Workspace */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
          {/* Left Column: Sticky Profile Parameters on large desktop (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 lg:self-start space-y-4">
            <section aria-label="Household Configuration">
              <ProfileForm
                profile={profile}
                onChange={setProfile}
                onSubmit={handleGeneratePlan}
                loading={loadingPlan}
              />
            </section>

            {planError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-700" />
                <span>{planError}</span>
              </div>
            )}

            {/* Scientific Inversion Principle Card */}
            <ThermalInversionCard />
          </div>

          {/* Right Column: Action Plan View or Placeholder (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {plan ? (
              <div ref={planSectionRef}>
                <ActionPlanView
                  plan={plan}
                  cityName={selectedCity.name}
                  usAqi={aqiReport ? aqiReport.usAqi : 150}
                  safestWindow={
                    aqiReport?.safestWindow ?? "14:00 - 16:00"
                  }
                  source={planSource}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <SlidersHorizontal className="mx-auto h-8 w-8 text-stone-400" />
                <h3 className="mt-3 text-sm font-semibold text-stone-900">
                  Ready to Calibrate Your Mitigation Plan
                </h3>
                <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Select your household profile parameters on the left and click &ldquo;Update Routine & Forecast&rdquo; to compute your evidence-informed schedule, indoor containment steps, and emission reductions.
                </p>
                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={loadingPlan || !aqiReport}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#164E3B] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#113D2E] transition disabled:opacity-50"
                >
                  Generate Plan Now
                </button>
              </div>
            )}

            {/* Environmental Health Consultation Panel */}
            <section aria-label="Environmental Health Assistant">
              <SmogCoachChat
                city={selectedCity.name}
                usAqi={aqiReport ? aqiReport.usAqi : 120}
                pm25={aqiReport ? aqiReport.pm25 : 45}
                householdSummary={householdSummary}
              />
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}

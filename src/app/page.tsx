"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  Wind,
  Sparkles,
  Info,
  AlertTriangle,
  Heart,
  Globe,
} from "lucide-react";
import { AqiDashboard } from "@/components/AqiDashboard";
import { ProfileForm } from "@/components/ProfileForm";
import { ActionPlanView } from "@/components/ActionPlanView";
import { SmogCoachChat } from "@/components/SmogCoachChat";
import type { AirQualityReport, CityLocation } from "@/lib/air-quality";
import type { GeneratedActionPlan, HouseholdProfile } from "@/lib/schemas";

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
          name: "My Local Coordinates",
          country: "Local Device",
          latitude: lat,
          longitude: lon,
        };
        setSelectedCity(localCity);
        setProfile((prev) => ({
          ...prev,
          city: "My Location",
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
      alert("Please wait for air quality data to load before generating a plan.");
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
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Top Banner / Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-md shadow-teal-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                  SmogShield
                </span>
                <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                  Winter Smog Edition
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-400 sm:block">
                Real-Time PM2.5 Routines, IAQ Hacks & Low-Emission Living
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-slate-300 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Open-Meteo Feeds</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-medium text-teal-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800/60 bg-gradient-to-b from-slate-900/60 to-slate-950 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300">
            <Wind className="h-3.5 w-3.5" />
            <span>Protecting Families & Communities During Urban Winter Smog</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Smarter Smog Routines. Clean Indoor Air.{" "}
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Zero Guesswork.
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base leading-relaxed">
            Time your ventilation to real hourly PM2.5 forecasts, safeguard infants & vulnerable lungs with budget-friendly indoor hacks, and discover high-impact sustainable choices with transparent health and emissions metrics.
          </p>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: AQI Dashboard + Household Profile (7 cols) */}
          <div className="space-y-8 lg:col-span-7">
            <section aria-label="Live Air Quality Dashboard">
              <AqiDashboard
                cityName={selectedCity.name}
                report={aqiReport}
                loading={loadingAqi}
                onSelectCity={handleSelectCity}
                onUseMyLocation={handleUseMyLocation}
              />
            </section>

            <section aria-label="Household Profile Configuration">
              <ProfileForm
                profile={profile}
                onChange={setProfile}
                onSubmit={handleGeneratePlan}
                loading={loadingPlan}
              />
            </section>

            {planError && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-300">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                <span>{planError}</span>
              </div>
            )}
          </div>

          {/* Right Column: Smog Coach GenAI Chat (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Live Smog Advisory AI
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Contextual Coach</span>
              </div>

              <SmogCoachChat
                city={selectedCity.name}
                usAqi={aqiReport ? aqiReport.usAqi : 120}
                pm25={aqiReport ? aqiReport.pm25 : 45}
                householdSummary={householdSummary}
              />

              {/* Quick Science Fact Box */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-xs text-slate-400 leading-relaxed">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Info className="h-4 w-4 text-teal-400" />
                  <span>The Winter Smog Inversion Principle</span>
                </div>
                <p className="mt-1.5">
                  During winter nights, the ground cools faster than the air above it, creating a thermal inversion lid that traps vehicle exhaust and biomass smoke within 100 meters of the ground. SmogShield pinpoints the exact daytime window when solar heating breaks this inversion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Action Plan Section */}
        {plan && (
          <div ref={planSectionRef} className="mt-12 pt-8 border-t border-slate-800">
            <ActionPlanView
              plan={plan}
              cityName={selectedCity.name}
              usAqi={aqiReport ? aqiReport.usAqi : 150}
              safestWindow={
                aqiReport?.safestWindow ?? "Mid-afternoon (14:00 - 16:00)"
              }
              source={planSource}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800 bg-slate-950 py-10 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-400" />
                <span className="font-bold text-slate-200">SmogShield</span>
                <span className="text-slate-500">|</span>
                <span>Urban Air Quality & Low-Emission Lifestyle Assistant</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Data sources: Free real-time atmospheric measurements from Open-Meteo & Google Gemini 2.5 Flash GenAI.
              </p>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Globe className="h-3.5 w-3.5 text-teal-400" />
                <span>Zero Commercial Key Required for AQI</span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                <span>Built for Community Health</span>
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Public Health & Medical Notice: </strong>
            SmogShield provides evidence-informed environmental mitigation strategies, schedule guidance, and DIY indoor air quality hacks. It does not furnish medical diagnoses or replace physician care. Individuals experiencing severe acute respiratory distress, cyanosis, or uncontrollable asthma exacerbations must seek emergency clinical care immediately.
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React from "react";
import { MapPin, Loader2, Wind, AlertTriangle } from "lucide-react";
import { CitySearchBar } from "./dashboard/CitySearchBar";
import { PollutantGauges } from "./dashboard/PollutantGauges";
import { InversionWindows } from "./dashboard/InversionWindows";
import { ForecastStrip } from "./dashboard/ForecastStrip";
import { classifyUsAqi } from "@/lib/aqi-utils";
import type { AirQualityReport, CityLocation } from "@/types/smogshield";

interface AqiDashboardProps {
  cityName: string;
  report: AirQualityReport | null;
  loading: boolean;
  onSelectCity: (city: CityLocation) => void;
  onUseMyLocation: () => void;
}

const PRESET_CITIES: CityLocation[] = [
  {
    name: "New Delhi",
    country: "India",
    admin1: "Delhi",
    latitude: 28.6139,
    longitude: 77.209,
  },
  {
    name: "Pune",
    country: "India",
    admin1: "Maharashtra",
    latitude: 18.5204,
    longitude: 73.8567,
  },
  {
    name: "Beijing",
    country: "China",
    admin1: "Beijing",
    latitude: 39.9042,
    longitude: 116.4074,
  },
  {
    name: "London",
    country: "United Kingdom",
    admin1: "England",
    latitude: 51.5074,
    longitude: -0.1278,
  },
];

/**
 * Air Quality Telemetry Dashboard presenting real-time pollutant measurements,
 * station geolocation controls, and 24-hour predictive forecast.
 */
export function AqiDashboard({
  cityName,
  report,
  loading,
  onSelectCity,
  onUseMyLocation,
}: AqiDashboardProps) {
  const classification = report ? classifyUsAqi(report.usAqi) : null;

  return (
    <div className="rounded-xl border border-stone-200/90 bg-white p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Top Location Controls Bar */}
      <div className="flex flex-col gap-3 pb-5 border-b border-stone-100 sm:flex-row sm:items-center sm:justify-between">
        <CitySearchBar onSelectCity={onSelectCity} />

        {/* Action Buttons: Geolocation & Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onUseMyLocation}
            aria-label="Detect air quality using my current location"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 transition"
          >
            <MapPin className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
            <span>My Location</span>
          </button>

          <div className="hidden h-4 w-px bg-stone-200 sm:block" aria-hidden="true" />

          <div className="flex items-center gap-1.5" role="group" aria-label="Preset major cities">
            {PRESET_CITIES.map((city) => {
              const isSelected =
                cityName.toLowerCase() === city.name.toLowerCase();
              return (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => onSelectCity(city)}
                  aria-pressed={isSelected}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                    isSelected
                      ? "bg-stone-900 text-white"
                      : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sensor Readout Telemetry Strip */}
      <div className="relative pt-5" aria-live="polite">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-1.5 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-stone-600" aria-hidden="true" />
              <span className="text-xs font-medium text-stone-700">
                Synchronizing sensor telemetry...
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          {/* Left Console: Location + Primary Index Score (5 cols) */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 text-stone-600">
              <Wind className="h-4 w-4 text-stone-700" aria-hidden="true" />
              <h2 className="text-lg font-bold tracking-tight text-stone-950">
                {cityName}
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-stone-600 font-mono">
              Ground-level telemetry • Open-Meteo Atmospheric Model
            </p>

            {report && classification && (
              <div className="mt-4 flex items-baseline gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-mono font-semibold tabular-nums tracking-tight text-stone-950">
                    {report.usAqi}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-600 font-mono">
                    US AQI
                  </span>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${classification.badgeClass}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${classification.dotClass}`}
                    aria-hidden="true"
                  />
                  <span>{report.category}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Console: Pollutants & Inversion Windows (7 cols) */}
          {report && (
            <div className="lg:col-span-7">
              <PollutantGauges report={report} />
              <InversionWindows
                safestWindow={report.safestWindow}
                peakSmogWindow={report.peakSmogWindow}
              />
            </div>
          )}
        </div>

        {/* 24-Hour Forecast Telemetry Bar Chart */}
        {report && <ForecastStrip forecast={report.hourlyForecast} />}

        {!report && !loading && (
          <div className="py-8 text-center text-stone-600">
            <AlertTriangle className="mx-auto h-6 w-6 text-stone-500" aria-hidden="true" />
            <p className="mt-2 text-xs font-medium">
              No telemetry available for this coordinate. Please select another city.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

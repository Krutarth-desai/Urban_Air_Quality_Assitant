"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  Loader2,
  Wind,
  ShieldAlert,
  Clock,
  AlertTriangle,
  X,
  ShieldCheck,
} from "lucide-react";
import type { AirQualityReport, CityLocation } from "@/lib/air-quality";

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

const COLOR_MAP: Record<
  AirQualityReport["colorToken"],
  {
    badge: string;
    scoreText: string;
    dot: string;
  }
> = {
  emerald: {
    badge: "bg-emerald-50 text-emerald-900 border-emerald-200",
    scoreText: "text-emerald-900",
    dot: "bg-emerald-600",
  },
  amber: {
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    scoreText: "text-amber-900",
    dot: "bg-amber-600",
  },
  orange: {
    badge: "bg-orange-50 text-orange-900 border-orange-200",
    scoreText: "text-orange-900",
    dot: "bg-orange-600",
  },
  red: {
    badge: "bg-red-50 text-red-900 border-red-200",
    scoreText: "text-red-900",
    dot: "bg-red-600",
  },
  severe: {
    badge: "bg-red-50 text-red-900 border-red-200",
    scoreText: "text-red-900",
    dot: "bg-red-700",
  },
  hazardous: {
    badge: "bg-red-50 text-red-900 border-red-200",
    scoreText: "text-red-900",
    dot: "bg-red-800",
  },
};

function getBarColor(pm25: number): string {
  if (pm25 <= 12) return "bg-emerald-600 hover:bg-emerald-500";
  if (pm25 <= 35.4) return "bg-amber-600 hover:bg-amber-500";
  if (pm25 <= 55.4) return "bg-orange-600 hover:bg-orange-500";
  return "bg-red-700 hover:bg-red-600";
}

export function AqiDashboard({
  cityName,
  report,
  loading,
  onSelectCity,
  onUseMyLocation,
}: AqiDashboardProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced city search (350ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/aqi?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = (await res.json()) as { cities?: CityLocation[] };
          setResults(data.cities ?? []);
          setDropdownOpen(true);
        }
      } catch (err) {
        console.error("Failed to query cities:", err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePickCity = (city: CityLocation) => {
    onSelectCity(city);
    setQuery("");
    setResults([]);
    setDropdownOpen(false);
  };

  const colorStyles = report
    ? COLOR_MAP[report.colorToken]
    : COLOR_MAP.emerald;

  const maxForecastPm25 = report?.hourlyForecast?.length
    ? Math.max(...report.hourlyForecast.map((p) => p.pm25), 35)
    : 50;

  return (
    <div className="rounded-xl border border-stone-200/90 bg-white p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Top Location Controls Bar */}
      <div className="flex flex-col gap-3 pb-5 border-b border-stone-100 sm:flex-row sm:items-center sm:justify-between">
        {/* City Search */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (val.trim().length < 2) {
                  setResults([]);
                  setSearching(false);
                  setDropdownOpen(false);
                }
              }}
              onFocus={() => {
                if (results.length > 0) setDropdownOpen(true);
              }}
              placeholder="Search station or city (e.g. New Delhi, Beijing)..."
              className="w-full rounded-lg border border-stone-300 bg-stone-50/50 py-2 pl-9 pr-9 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:outline-none transition shadow-2xs"
            />
            {searching ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-stone-500" />
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setDropdownOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {dropdownOpen && results.length > 0 && (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
              {results.map((city, idx) => (
                <button
                  key={`${city.name}-${city.latitude}-${idx}`}
                  type="button"
                  onClick={() => handlePickCity(city)}
                  className="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs text-stone-800 transition hover:bg-stone-50"
                >
                  <span className="font-medium text-stone-900">
                    {city.name}
                    {city.admin1 ? `, ${city.admin1}` : ""}
                  </span>
                  <span className="font-mono text-[11px] text-stone-500">
                    {city.country}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: Geolocation & Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onUseMyLocation}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-950 transition"
          >
            <MapPin className="h-3.5 w-3.5 text-stone-500" />
            <span>My Location</span>
          </button>

          <div className="hidden h-4 w-px bg-stone-200 sm:block" />

          <div className="flex items-center gap-1.5">
            {PRESET_CITIES.map((city) => {
              const isSelected =
                cityName.toLowerCase() === city.name.toLowerCase();
              return (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handlePickCity(city)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    isSelected
                      ? "bg-stone-900 text-white"
                      : "border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
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
      <div className="relative pt-5">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-1.5 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-stone-600" />
              <span className="text-xs font-medium text-stone-700">
                Synchronizing sensor telemetry...
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          {/* Left Console: Location + Primary Index Score (5 cols) */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 text-stone-500">
              <Wind className="h-4 w-4 text-stone-700" />
              <h2 className="text-lg font-bold tracking-tight text-stone-950">
                {cityName}
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-stone-500 font-mono">
              Ground-level telemetry • Open-Meteo Atmospheric Model
            </p>

            {report && (
              <div className="mt-4 flex items-baseline gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-mono font-semibold tabular-nums tracking-tight text-stone-950">
                    {report.usAqi}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-500 font-mono">
                    US AQI
                  </span>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${colorStyles.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${colorStyles.dot}`} />
                  <span>{report.category}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Console: Pollutants & Inversion Windows (7 cols) */}
          {report && (
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
                    PM2.5 (Fine)
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-stone-950">
                    {report.pm25}
                    <span className="text-xs font-normal text-stone-500 ml-1">
                      µg/m³
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-stone-500">
                    Limit: 15
                  </div>
                </div>

                <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
                    PM10 (Coarse)
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-stone-950">
                    {report.pm10}
                    <span className="text-xs font-normal text-stone-500 ml-1">
                      µg/m³
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-stone-500">
                    Road soot
                  </div>
                </div>

                <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
                    NO2 (Dioxide)
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-stone-950">
                    {report.no2}
                    <span className="text-xs font-normal text-stone-500 ml-1">
                      µg/m³
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-stone-500">
                    Exhaust
                  </div>
                </div>

                <div className="rounded-lg border border-stone-200/80 bg-stone-50/70 p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
                    O3 (Ozone)
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-stone-950">
                    {report.o3}
                    <span className="text-xs font-normal text-stone-500 ml-1">
                      µg/m³
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-stone-500">
                    Oxidant
                  </div>
                </div>
              </div>

              {/* Windows Callouts */}
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex items-start gap-2.5 rounded-lg border border-stone-200 bg-stone-50/50 p-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
                      Safest Ventilation Window
                    </span>
                    <div className="text-xs font-semibold text-stone-900 truncate">
                      {report.safestWindow}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-stone-200 bg-stone-50/50 p-2.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-700 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
                      Peak Smog Window
                    </span>
                    <div className="text-xs font-semibold text-stone-900 truncate">
                      {report.peakSmogWindow}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 24-Hour Forecast Telemetry Bar Chart */}
        {report && (
          <div className="mt-5 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-500 font-mono">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                <span>24-Hour PM2.5 Forecast Telemetry (µg/m³)</span>
              </div>
              {hoveredPointIdx !== null &&
                report.hourlyForecast[hoveredPointIdx] && (
                  <div className="font-mono text-xs font-semibold tabular-nums text-stone-900">
                    {report.hourlyForecast[hoveredPointIdx].hourLabel}:{" "}
                    {report.hourlyForecast[hoveredPointIdx].pm25} µg/m³ (AQI{" "}
                    {report.hourlyForecast[hoveredPointIdx].usAqi})
                  </div>
                )}
            </div>

            <div className="mt-3 flex h-20 items-end gap-1 sm:gap-1.5">
              {report.hourlyForecast.slice(0, 24).map((pt, idx) => {
                const heightPct = Math.max(
                  Math.round((pt.pm25 / maxForecastPm25) * 100),
                  8
                );
                const isHovered = hoveredPointIdx === idx;
                const barColor = getBarColor(pt.pm25);

                return (
                  <div
                    key={pt.time}
                    onMouseEnter={() => setHoveredPointIdx(idx)}
                    onMouseLeave={() => setHoveredPointIdx(null)}
                    className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xs transition-all duration-100 ${barColor} ${
                        isHovered ? "ring-1 ring-stone-950 scale-105" : ""
                      }`}
                    />

                    <div className="pointer-events-none absolute -top-8 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded border border-stone-800 bg-stone-950 px-2 py-0.5 font-mono text-[10px] text-white shadow-sm group-hover:block">
                      {pt.hourLabel}: {pt.pm25} µg/m³
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-1.5 flex justify-between text-[10px] font-mono text-stone-400">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>
        )}

        {!report && !loading && (
          <div className="py-8 text-center text-stone-500">
            <AlertTriangle className="mx-auto h-6 w-6 text-stone-400" />
            <p className="mt-2 text-xs font-medium">
              No telemetry available for this coordinate. Please select another city.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

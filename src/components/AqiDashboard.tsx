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
  Sparkles,
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
    border: string;
    glow: string;
    text: string;
    metricBg: string;
  }
> = {
  emerald: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    border: "border-emerald-500/40",
    glow: "shadow-emerald-500/10",
    text: "text-emerald-400",
    metricBg: "bg-emerald-950/30",
  },
  amber: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    border: "border-amber-500/40",
    glow: "shadow-amber-500/10",
    text: "text-amber-400",
    metricBg: "bg-amber-950/30",
  },
  orange: {
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    border: "border-orange-500/40",
    glow: "shadow-orange-500/10",
    text: "text-orange-400",
    metricBg: "bg-orange-950/30",
  },
  red: {
    badge: "bg-red-500/15 text-red-300 border-red-500/40",
    border: "border-red-500/40",
    glow: "shadow-red-500/10",
    text: "text-red-400",
    metricBg: "bg-red-950/30",
  },
  purple: {
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/40",
    border: "border-purple-500/40",
    glow: "shadow-purple-500/10",
    text: "text-purple-400",
    metricBg: "bg-purple-950/30",
  },
  rose: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    border: "border-rose-500/40",
    glow: "shadow-rose-500/10",
    text: "text-rose-400",
    metricBg: "bg-rose-950/30",
  },
};

function getBarColor(pm25: number): string {
  if (pm25 <= 12) return "bg-emerald-500 hover:bg-emerald-400";
  if (pm25 <= 35.4) return "bg-amber-500 hover:bg-amber-400";
  if (pm25 <= 55.4) return "bg-orange-500 hover:bg-orange-400";
  if (pm25 <= 150.4) return "bg-red-500 hover:bg-red-400";
  if (pm25 <= 250.4) return "bg-purple-500 hover:bg-purple-400";
  return "bg-rose-600 hover:bg-rose-500";
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
    <div className="space-y-6">
      {/* Search Bar & Location Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div ref={searchContainerRef} className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              placeholder="Search city for live winter smog & AQI..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-400 shadow-inner backdrop-blur-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            {searching && (
              <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-400" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {dropdownOpen && results.length > 0 && (
            <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/95 py-1.5 shadow-2xl backdrop-blur-md">
              {results.map((city, idx) => (
                <button
                  key={`${city.name}-${city.latitude}-${idx}`}
                  type="button"
                  onClick={() => handlePickCity(city)}
                  className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-slate-200 transition hover:bg-teal-500/15 hover:text-white"
                >
                  <span className="font-medium">
                    {city.name}
                    {city.admin1 ? `, ${city.admin1}` : ""}
                  </span>
                  <span className="text-xs text-slate-400">{city.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onUseMyLocation}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/50 hover:bg-slate-700 hover:text-teal-300"
        >
          <MapPin className="h-4 w-4 text-teal-400" />
          <span>My Location</span>
        </button>
      </div>

      {/* Preset Demo Cities */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Demo Hotspots:
        </span>
        {PRESET_CITIES.map((city) => (
          <button
            key={city.name}
            type="button"
            onClick={() => handlePickCity(city)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              cityName.toLowerCase() === city.name.toLowerCase()
                ? "border-teal-500 bg-teal-500/20 text-teal-200"
                : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {city.name}
          </button>
        ))}
      </div>

      {/* Live Air Quality Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm transition-all duration-300 md:p-7 ${colorStyles.border} ${colorStyles.glow}`}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-[2px]">
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
              <span className="text-sm font-medium text-slate-200">
                Fetching fresh atmospheric data...
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-teal-400" />
              <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                {cityName}
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Live winter meteorological & aerosol readings from Open-Meteo
            </p>
          </div>

          {report && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  US AQI Index
                </span>
                <div className={`text-3xl font-extrabold tracking-tight md:text-4xl ${colorStyles.text}`}>
                  {report.usAqi}
                </div>
              </div>
              <div
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm ${colorStyles.badge}`}
              >
                {report.category}
              </div>
            </div>
          )}
        </div>

        {report ? (
          <div className="mt-6 space-y-6">
            {/* Pollutant Pills */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-xs font-semibold text-slate-400">
                  PM2.5 (Fine)
                </div>
                <div className="mt-1 text-lg font-bold text-slate-100">
                  {report.pm25}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    µg/m³
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  WHO 24h limit: 15
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-xs font-semibold text-slate-400">
                  PM10 (Coarse)
                </div>
                <div className="mt-1 text-lg font-bold text-slate-100">
                  {report.pm10}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    µg/m³
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Road & construction dust
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-xs font-semibold text-slate-400">
                  NO2 (Dioxide)
                </div>
                <div className="mt-1 text-lg font-bold text-slate-100">
                  {report.no2}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    µg/m³
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Vehicle exhaust & flame
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="text-xs font-semibold text-slate-400">
                  O3 (Ozone)
                </div>
                <div className="mt-1 text-lg font-bold text-slate-100">
                  {report.o3}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    µg/m³
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Photochemical smog
                </div>
              </div>
            </div>

            {/* Smart Windows Callouts */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
                <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Safest Outdoor Window
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-slate-100">
                    {report.safestWindow}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Optimal time for short cross-ventilation, walking pets, or essential errands.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5">
                <div className="rounded-lg bg-rose-500/20 p-2 text-rose-300">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                    Peak Smog Window
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-slate-100">
                    {report.peakSmogWindow}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Inversion layer traps toxic particles close to ground. Keep windows sealed.
                  </p>
                </div>
              </div>
            </div>

            {/* 24-Hour PM2.5 Forecast Mini Bar Chart */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-teal-400" />
                  <span>24-Hour PM2.5 Forecast (µg/m³)</span>
                </div>
                {hoveredPointIdx !== null && report.hourlyForecast[hoveredPointIdx] && (
                  <div className="text-xs font-semibold text-teal-300">
                    {report.hourlyForecast[hoveredPointIdx].hourLabel} —{" "}
                    {report.hourlyForecast[hoveredPointIdx].pm25} µg/m³ (AQI{" "}
                    {report.hourlyForecast[hoveredPointIdx].usAqi})
                  </div>
                )}
              </div>

              <div className="mt-4 flex h-24 items-end gap-1 sm:gap-1.5">
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
                      {/* Interactive Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-sm transition-all duration-150 ${barColor} ${
                          isHovered ? "ring-2 ring-white scale-105" : ""
                        }`}
                      />

                      {/* Tooltip on Hover */}
                      <div className="pointer-events-none absolute -top-10 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white shadow-xl group-hover:block">
                        {pt.hourLabel}: {pt.pm25} µg/m³
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart Time Labels */}
              <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="mt-8 flex flex-col items-center justify-center py-6 text-center text-slate-400">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="mt-2 text-sm">
                No air quality data available. Please pick a city or use your location.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

import { appCache } from "./cache";
import { classifyUsAqi as classifyAqiUtil } from "./aqi-utils";
import type { AirQualityReport, CityLocation, HourlyPoint } from "@/types/smogshield";

export type { CityLocation, HourlyPoint, AirQualityReport };

/**
 * Classifies a US AQI index value into category name and color token.
 * Provided for backward compatibility; calls `classifyUsAqi` from `@/lib/aqi-utils`.
 *
 * @param aqi - Numerical US AQI score
 * @returns Object with category and colorToken
 */
export function classifyUsAqi(aqi: number): {
  category: AirQualityReport["category"];
  colorToken: AirQualityReport["colorToken"];
} {
  const result = classifyAqiUtil(aqi);
  return {
    category: result.category,
    colorToken: result.colorToken,
  };
}

/**
 * Searches for global cities and geographic coordinates via Open-Meteo Geocoding API.
 * Results are cached in-memory with a 30-minute TTL.
 *
 * @param query - City name or search string
 * @returns Array of matching CityLocation records
 */
export async function searchCities(query: string): Promise<CityLocation[]> {
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) return [];

  const cacheKey = `geo:${clean}`;
  const cached = appCache.get<CityLocation[]>(cacheKey);
  if (cached) return cached;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    clean
  )}&count=5&language=en&format=json`;

  const res = await fetch(url, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Failed to search cities");

  const data = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const results: CityLocation[] = (data.results ?? []).map(
    (item: Record<string, unknown>) => ({
      name: String(item.name ?? ""),
      country: String(item.country ?? ""),
      admin1: item.admin1 ? String(item.admin1) : undefined,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
    })
  );

  appCache.set(cacheKey, results, 30 * 60 * 1000); // 30 min cache
  return results;
}

/**
 * Fetches real-time atmospheric pollutant telemetry and 24-hour forecast from Open-Meteo.
 * Identifies optimal and peak smog windows for winter temperature inversion scheduling.
 *
 * @param lat - Latitude coordinate (-90 to 90)
 * @param lon - Longitude coordinate (-180 to 180)
 * @returns Complete AirQualityReport
 */
export async function fetchAirQuality(
  lat: number,
  lon: number
): Promise<AirQualityReport> {
  const cacheKey = `aqi:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = appCache.get<AirQualityReport>(cacheKey);
  if (cached) return cached;

  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone` +
    `&hourly=pm2_5,us_aqi&forecast_days=1&timezone=auto`;

  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Failed to fetch live air quality data");

  const data = (await res.json()) as {
    current?: Record<string, number | undefined>;
    hourly?: {
      time?: string[];
      pm2_5?: number[];
      us_aqi?: number[];
    };
  };

  const current = data.current ?? {};
  const hourlyTimes: string[] = data.hourly?.time ?? [];
  const hourlyPm25: number[] = data.hourly?.pm2_5 ?? [];
  const hourlyAqi: number[] = data.hourly?.us_aqi ?? [];

  const hourlyForecast: HourlyPoint[] = hourlyTimes
    .slice(0, 24)
    .map((t, idx) => {
      const hourPart = t.split("T")[1]?.slice(0, 5) ?? "00:00";
      return {
        time: t,
        hourLabel: hourPart,
        pm25: Math.round((hourlyPm25[idx] ?? 0) * 10) / 10,
        usAqi: Math.round(hourlyAqi[idx] ?? 0),
      };
    });

  // Identify safest and worst 2-hour windows for winter smog scheduling
  let safest = hourlyForecast[0];
  let worst = hourlyForecast[0];
  for (const pt of hourlyForecast) {
    if (safest && pt.pm25 < safest.pm25) safest = pt;
    if (worst && pt.pm25 > worst.pm25) worst = pt;
  }

  const usAqi = Math.round(Number(current.us_aqi ?? 0));
  const { category, colorToken } = classifyUsAqi(usAqi);

  const report: AirQualityReport = {
    usAqi,
    pm25: Math.round(Number(current.pm2_5 ?? 0) * 10) / 10,
    pm10: Math.round(Number(current.pm10 ?? 0) * 10) / 10,
    no2: Math.round(Number(current.nitrogen_dioxide ?? 0) * 10) / 10,
    o3: Math.round(Number(current.ozone ?? 0) * 10) / 10,
    category,
    colorToken,
    safestWindow: safest
      ? `Around ${safest.hourLabel} (PM2.5 ~${safest.pm25} ug/m3)`
      : "Mid-afternoon (14:00 - 16:00)",
    peakSmogWindow: worst
      ? `Around ${worst.hourLabel} (PM2.5 ~${worst.pm25} ug/m3)`
      : "Early morning (06:00 - 09:00)",
    hourlyForecast,
    updatedAt: new Date().toISOString(),
  };

  appCache.set(cacheKey, report, 10 * 60 * 1000); // 10 min cache
  return report;
}

import { appCache } from "./cache";

export interface CityLocation {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface HourlyPoint {
  time: string;
  hourLabel: string;
  pm25: number;
  usAqi: number;
}

export interface AirQualityReport {
  usAqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  category:
    | "Good"
    | "Moderate"
    | "Unhealthy for Sensitive Groups"
    | "Unhealthy"
    | "Very Unhealthy"
    | "Hazardous";
  colorToken: "emerald" | "amber" | "orange" | "red" | "severe" | "hazardous";
  safestWindow: string;
  peakSmogWindow: string;
  hourlyForecast: HourlyPoint[];
  updatedAt: string;
}

export function classifyUsAqi(aqi: number): {
  category: AirQualityReport["category"];
  colorToken: AirQualityReport["colorToken"];
} {
  if (aqi <= 50) return { category: "Good", colorToken: "emerald" };
  if (aqi <= 100) return { category: "Moderate", colorToken: "amber" };
  if (aqi <= 150)
    return {
      category: "Unhealthy for Sensitive Groups",
      colorToken: "orange",
    };
  if (aqi <= 200) return { category: "Unhealthy", colorToken: "red" };
  if (aqi <= 300) return { category: "Very Unhealthy", colorToken: "severe" };
  return { category: "Hazardous", colorToken: "hazardous" };
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) return [];

  const cacheKey = `geo:${clean}`;
  const cached = appCache.get<CityLocation[]>(cacheKey);
  if (cached) return cached;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    clean
  )}&count=5&language=en&format=json`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to search cities");

  const data = await res.json();
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

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch live air quality data");

  const data = await res.json();
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

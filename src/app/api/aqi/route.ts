import { NextResponse } from "next/server";
import { fetchAirQuality, searchCities } from "@/lib/air-quality";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeUserInput } from "@/lib/sanitize";

/**
 * GET /api/aqi
 *
 * Fetches real-time atmospheric pollutant concentrations for a coordinate (?lat=...&lon=...)
 * or searches global cities (?q=...). Enforces IP-based rate limiting and uses in-memory TTL caching.
 *
 * @param request - Incoming Next.js HTTP request
 * @returns JSON response with CityLocation[] or AirQualityReport
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`aqi:${ip}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  try {
    if (query) {
      if (query.length > 80) {
        return NextResponse.json({ error: "Query too long" }, { status: 400 });
      }
      const cleanQuery = sanitizeUserInput(query, 80);
      const cities = await searchCities(cleanQuery);
      return NextResponse.json({ cities });
    }

    if (lat && lon) {
      const latNum = Number(lat);
      const lonNum = Number(lon);
      if (
        Number.isNaN(latNum) ||
        Number.isNaN(lonNum) ||
        latNum < -90 ||
        latNum > 90 ||
        lonNum < -180 ||
        lonNum > 180
      ) {
        return NextResponse.json(
          { error: "Invalid coordinates" },
          { status: 400 }
        );
      }
      const report = await fetchAirQuality(latNum, lonNum);
      return NextResponse.json({ report });
    }

    return NextResponse.json(
      { error: "Provide either ?q=city or ?lat=...&lon=..." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[/api/aqi] Error:", error);
    return NextResponse.json(
      { error: "Unable to retrieve air quality data right now." },
      { status: 502 }
    );
  }
}

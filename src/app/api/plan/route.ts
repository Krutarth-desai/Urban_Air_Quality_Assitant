import { NextResponse } from "next/server";
import { PlanRequestSchema } from "@/lib/schemas";
import { generateTailoredAirPlan } from "@/lib/gemini";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/plan
 *
 * Generates a calibrated winter smog and particulate mitigation plan for a household profile.
 * Validates request payload against Zod schema and enforces server-side rate limits.
 *
 * @param request - Incoming Next.js HTTP request containing profile and telemetry snapshot
 * @returns JSON response with GeneratedActionPlan and generation source
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`plan:${ip}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before generating a new plan." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = PlanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await generateTailoredAirPlan(
      parsed.data.profile,
      parsed.data.aqiData
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/plan] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate personalized plan." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SupabaseProfileSchema } from "@/lib/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { parseJsonBody, sanitizeUserInput } from "@/lib/sanitize";

/**
 * GET /api/profile
 *
 * Retrieves the authenticated user's saved household profile from Supabase Postgres.
 * Requires an active user session; returns 401 if unauthenticated.
 *
 * @param request - Incoming Next.js HTTP request
 * @returns JSON response with saved Supabase household profile or null
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`profile-get:${ip}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("household_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[/api/profile GET] Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch household profile." },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (err: unknown) {
    console.error("[/api/profile GET] Internal error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve profile." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 *
 * Upserts household profile settings (city, vulnerabilities, purifier, commute)
 * to Supabase Postgres, scoped to the authenticated user ID under Row-Level Security.
 * Enforces payload limits and input sanitization.
 *
 * @param request - Incoming Next.js HTTP request with profile payload
 * @returns JSON response with upserted household profile record
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`profile-post:${ip}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many profile updates. Please pause briefly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: body, errorResponse } = await parseJsonBody(request, 16_384);
    if (errorResponse) return errorResponse;

    const parsed = SupabaseProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid profile data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const sanitizedCity = sanitizeUserInput(parsed.data.city, 100);

    const { data, error } = await supabase
      .from("household_profiles")
      .upsert(
        {
          user_id: user.id,
          city: sanitizedCity,
          has_kids: parsed.data.has_kids,
          has_seniors: parsed.data.has_seniors,
          has_respiratory_condition: parsed.data.has_respiratory_condition,
          has_hepa_purifier: parsed.data.has_hepa_purifier,
          commute_mode: parsed.data.commute_mode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[/api/profile POST] Database error:", error);
      return NextResponse.json(
        { error: "Failed to save household profile." },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (err: unknown) {
    console.error("[/api/profile POST] Internal error:", err);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}

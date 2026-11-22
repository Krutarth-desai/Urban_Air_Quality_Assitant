import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SavePlanRequestSchema } from "@/lib/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`plans-get:${ip}`, 30, 60_000);
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
      .from("saved_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[/api/plans GET] Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch saved plans." },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans: data ?? [] });
  } catch (err: unknown) {
    console.error("[/api/plans GET] Internal error:", err);
    return NextResponse.json(
      { error: "Failed to load saved plans." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`plans-post:${ip}`, 15, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment." },
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

    const body = await request.json();
    const parsed = SavePlanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("saved_plans")
      .insert({
        user_id: user.id,
        city: parsed.data.city,
        aqi_value: parsed.data.aqi_value,
        plan_json: parsed.data.plan_json,
        completed_actions: parsed.data.completed_actions,
      })
      .select()
      .single();

    if (error) {
      console.error("[/api/plans POST] Database error:", error);
      return NextResponse.json(
        { error: "Failed to save plan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan: data });
  } catch (err: unknown) {
    console.error("[/api/plans POST] Internal error:", err);
    return NextResponse.json(
      { error: "Unable to save plan right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`plans-del:${ip}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment." },
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

    const { searchParams } = new URL(request.url);
    let planId = searchParams.get("id");

    if (!planId) {
      try {
        const body = await request.json();
        planId = body?.id;
      } catch {}
    }

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("saved_plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[/api/plans DELETE] Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete plan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedId: planId });
  } catch (err: unknown) {
    console.error("[/api/plans DELETE] Internal error:", err);
    return NextResponse.json(
      { error: "Unable to delete plan." },
      { status: 500 }
    );
  }
}

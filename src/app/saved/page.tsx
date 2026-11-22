import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bookmark,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Wind,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { classifyUsAqi } from "@/lib/aqi-utils";
import { DeletePlanButton } from "@/components/DeletePlanButton";
import type { SavedPlanRow } from "@/lib/schemas";

export default async function SavedPlansPage() {
  let user = null;
  let plans: SavedPlanRow[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;

    if (!user) {
      redirect("/login");
    }

    const { data: fetchedPlans, error } = await supabase
      .from("saved_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SavedPlansPage] Database error:", error);
    } else {
      plans = (fetchedPlans as SavedPlanRow[]) ?? [];
    }
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    if (
      err &&
      typeof err === "object" &&
      "message" in err &&
      err.message === "NEXT_REDIRECT"
    ) {
      throw err;
    }
    console.warn("Could not fetch user / plans:", err);
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Top back navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Telemetry Console</span>
        </Link>
        <span className="font-mono text-xs text-stone-500">
          User: <strong className="text-stone-800">{user.email}</strong>
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#164E3B] text-white">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-950">
              Saved Mitigation Plans
            </h1>
            <p className="text-xs text-stone-500">
              Review, track, and manage your cloud-synced particulate routines.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#164E3B] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#113D2E] active:scale-95"
        >
          <span>Generate New Plan</span>
        </Link>
      </div>

      {/* Responsive Card Grid */}
      {plans.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {plans.map((item) => {
            const { category, badgeClass } = classifyUsAqi(item.aqi_value);

            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recently";

            const summary =
              item.plan_json?.severitySummary ||
              item.plan_json?.winterSmogInsight ||
              "Personalized household mitigation routine.";

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-stone-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-stone-300"
              >
                <div className="space-y-3">
                  {/* Card Header: City + AQI badge + Delete button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-stone-700" />
                      <h2 className="text-base font-bold text-stone-950">
                        {item.city}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${badgeClass}`}
                      >
                        AQI {item.aqi_value} • {category}
                      </span>
                      <DeletePlanButton planId={item.id} />
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                    {summary}
                  </p>
                </div>

                {/* Card Footer: Date & Committed actions */}
                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3 text-[11px] text-stone-500">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="h-3 w-3 text-stone-400" />
                    <span>{dateStr}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 font-mono font-medium text-emerald-800">
                    <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                    <span>
                      {item.completed_actions?.length || 0} active
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-12">
          <Bookmark className="mx-auto h-8 w-8 text-stone-400" />
          <h2 className="mt-3 text-sm font-semibold text-stone-900">
            No saved plans found
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-stone-500 leading-relaxed">
            Generate an action plan on the live console and click &ldquo;Save Plan&rdquo; to store your mitigation routines in your account.
          </p>

          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#164E3B] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#113D2E]"
            >
              <span>Go to Telemetry Console</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bookmark,
  ArrowLeft,
  Shield,
  Sparkles,
  Calendar,
  CheckCircle2,
  Wind,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { classifyUsAqi } from "@/lib/air-quality";
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
    // If redirect was called, re-throw to allow Next.js navigation
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-teal-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Live Dashboard</span>
        </Link>
        <span className="text-xs text-slate-500">
          Logged in as <strong className="text-slate-300">{user.email}</strong>
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-500/20 p-2.5 text-teal-300">
            <Bookmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              Saved Smog Action Plans
            </h1>
            <p className="text-xs text-slate-400">
              Review, track, and manage your family&apos;s personalized mitigation routines.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:from-teal-400 hover:to-emerald-400"
        >
          <Sparkles className="h-4 w-4" />
          <span>Generate New Plan</span>
        </Link>
      </div>

      {plans.length > 0 ? (
        <div className="mt-8 space-y-4">
          {plans.map((item) => {
            const { category } = classifyUsAqi(item.aqi_value);
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
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition hover:border-slate-700 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1.5 text-lg font-bold text-white">
                        <Wind className="h-5 w-5 text-teal-400" />
                        <span>{item.city}</span>
                      </div>
                      <span className="rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-0.5 text-xs font-bold text-slate-200">
                        US AQI {item.aqi_value} ({category})
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      {summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {dateStr}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-teal-300">
                        <CheckCircle2 className="h-3 w-3 text-teal-400" />
                        {item.completed_actions?.length || 0} committed actions
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-start">
                    <DeletePlanButton planId={item.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl backdrop-blur-sm text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-teal-400">
            <Shield className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">
            No saved plans found
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
            Generate a personalized action plan on the dashboard and click &quot;Save Plan to Account&quot; to securely store your mitigation routines in Supabase.
          </p>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:from-teal-400 hover:to-emerald-400"
            >
              <Sparkles className="h-4 w-4" />
              <span>Go to Live Dashboard</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Leaf,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  TrendingUp,
  Shield,
  Bookmark,
  LogIn,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import type { ActionItem, GeneratedActionPlan } from "@/lib/schemas";

interface ActionPlanViewProps {
  plan: GeneratedActionPlan;
  cityName: string;
  usAqi: number;
  safestWindow: string;
  source?: "gemini" | "fallback";
}

type TabType = "routines" | "indoor" | "alternatives";

const DIFFICULTY_STYLES: Record<
  ActionItem["difficulty"],
  { badge: string }
> = {
  Easy: {
    badge: "border-stone-200 bg-stone-100 text-stone-700",
  },
  Medium: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
  },
  High: {
    badge: "border-stone-300 bg-stone-200 text-stone-800",
  },
};

export function ActionPlanView({
  plan,
  cityName,
  usAqi,
  safestWindow,
  source = "gemini",
}: ActionPlanViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("routines");
  // Initialize committed items with the first routine and first indoor hack committed by default
  const [committedIds, setCommittedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (plan.dailyRoutines[0]) initial.add(plan.dailyRoutines[0].id);
    if (plan.indoorHacks[0]) initial.add(plan.indoorHacks[0].id);
    return initial;
  });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);

  const handleSavePlan = async () => {
    setSaving(true);
    setAuthPrompt(false);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityName,
          aqi_value: usAqi,
          plan_json: plan,
          completed_actions: Array.from(committedIds),
        }),
      });

      if (res.status === 401) {
        setAuthPrompt(true);
        return;
      }

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed to save plan:", err);
    } finally {
      setSaving(false);
    }
  };

  // All 9 items across the 3 categories
  const allItems: ActionItem[] = [
    ...plan.dailyRoutines,
    ...plan.indoorHacks,
    ...plan.sustainableAlternatives,
  ];

  // Calculate live cumulative metrics for committed items
  const committedItems = allItems.filter((item) => committedIds.has(item.id));
  const totalCo2Saved = committedItems.reduce(
    (acc, item) => acc + item.estimatedCo2SavedKgPerWeek,
    0
  );
  const totalPm25Reduction = Math.min(
    committedItems.reduce(
      (acc, item) => acc + item.estimatedPm25ExposureReductionPct,
      0
    ),
    85 // Cap realistic combined exposure reduction
  );

  const toggleCommit = (id: string) => {
    setCommittedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyAlert = async () => {
    const textToCopy = `🚨 Atmospheric Advisory for ${cityName}
Live Air Quality: US AQI ${usAqi}
🍃 Safest Outdoor Window: ${safestWindow}
💡 Action Tip: ${plan.communityTip}

Telemetry source: SmogShield`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy alert:", err);
    }
  };

  const currentTabItems: ActionItem[] =
    activeTab === "routines"
      ? plan.dailyRoutines
      : activeTab === "indoor"
      ? plan.indoorHacks
      : plan.sustainableAlternatives;

  return (
    <div className="rounded-xl border border-stone-200/90 bg-white p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-6">
      {/* 1. Header & Severity Summary */}
      <div className="flex flex-col gap-3 pb-5 border-b border-stone-200/80 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-stone-950">
              Personalized Smog Action Plan
            </h3>
            <span className="font-mono text-[10px] uppercase text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
              {source === "gemini" ? "Calibrated Model" : "Deterministic Engine"}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-600 leading-relaxed max-w-2xl">
            {plan.severitySummary}
          </p>
        </div>

        {/* Top Actions: Save Plan to Account */}
        <div className="flex shrink-0 items-center gap-2">
          {savedSuccess ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-2xs">
              <Check className="h-3.5 w-3.5 text-emerald-700" />
              <span>Saved to Account</span>
            </div>
          ) : authPrompt ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-2xs transition hover:bg-amber-100"
            >
              <LogIn className="h-3.5 w-3.5 text-amber-800" />
              <span>Sign in to save →</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 shadow-2xs transition hover:bg-stone-50 active:scale-95 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-600" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5 text-stone-500" />
                  <span>Save Plan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Microclimate Inversion Insight */}
      <div className="flex items-start gap-2.5 rounded-lg border border-stone-200 bg-stone-50/70 p-3 text-xs leading-relaxed text-stone-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-stone-600" />
        <div>
          <strong className="font-semibold text-stone-900">
            Winter Inversion Dynamic:{" "}
          </strong>
          {plan.winterSmogInsight}
        </div>
      </div>

      {/* 2. Understated Direct Impact Bar */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-stone-200/60">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-stone-700" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800 font-mono">
              Live Direct Impact Telemetry
            </h4>
          </div>
          <span className="font-mono text-xs text-stone-500">
            {committedItems.length} of {allItems.length} commitments active
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* PM2.5 Inhalation Exposure Reduction */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700">
                Inhaled PM2.5 Reduction
              </span>
              <span className="font-mono font-semibold tabular-nums text-emerald-800 text-sm">
                ~{totalPm25Reduction}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                style={{ width: `${Math.min(totalPm25Reduction, 100)}%` }}
                className="h-full rounded-full bg-[#164E3B] transition-all duration-300"
              />
            </div>
            <div className="mt-1 text-[11px] text-stone-500">
              Calculated reduction in fine soot particulate entering lungs.
            </div>
          </div>

          {/* Community CO2 Reduction */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700">
                Community CO2 Avoidance
              </span>
              <span className="font-mono font-semibold tabular-nums text-stone-900 text-sm">
                {totalCo2Saved.toFixed(1)} kg / wk
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                style={{
                  width: `${Math.min((totalCo2Saved / 25) * 100, 100)}%`,
                }}
                className="h-full rounded-full bg-stone-800 transition-all duration-300"
              />
            </div>
            <div className="mt-1 text-[11px] text-stone-500">
              Equivalent to ~{(totalCo2Saved * 4.2).toFixed(0)} km of gasoline combustion eliminated.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("routines")}
          className={`pb-2.5 text-xs font-semibold transition border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === "routines"
              ? "border-stone-900 text-stone-950"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Daily Routines ({plan.dailyRoutines.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("indoor")}
          className={`pb-2.5 text-xs font-semibold transition border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === "indoor"
              ? "border-stone-900 text-stone-950"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Indoor Air Hacks ({plan.indoorHacks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("alternatives")}
          className={`pb-2.5 text-xs font-semibold transition border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === "alternatives"
              ? "border-stone-900 text-stone-950"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Leaf className="h-3.5 w-3.5" />
          <span>Low-Emission Shifts ({plan.sustainableAlternatives.length})</span>
        </button>
      </div>

      {/* 4. Action Cards Grid with 1px dividers */}
      <div className="divide-y divide-stone-200">
        {currentTabItems.map((item) => {
          const isCommitted = committedIds.has(item.id);
          const diffStyles = DIFFICULTY_STYLES[item.difficulty];

          return (
            <div
              key={item.id}
              className={`py-4 first:pt-0 last:pb-0 transition-colors ${
                isCommitted ? "bg-stone-50/40 rounded-lg p-3 -mx-3" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCommit(item.id)}
                    className="mt-0.5 text-stone-800 transition hover:text-stone-950"
                    aria-label={`Commit to ${item.title}`}
                  >
                    {isCommitted ? (
                      <CheckSquare className="h-4 w-4 text-[#164E3B]" />
                    ) : (
                      <Square className="h-4 w-4 text-stone-400 hover:text-stone-600" />
                    )}
                  </button>

                  <div>
                    <h4 className="text-sm font-semibold text-stone-950">
                      {item.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-stone-500">
                    <Clock className="h-3 w-3 text-stone-400" />
                    {item.timingOrFrequency}
                  </span>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-medium ${diffStyles.badge}`}
                  >
                    {item.difficulty}
                  </span>
                </div>
              </div>

              {/* Two-column Impact Explanation */}
              <div className="mt-3 ml-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-emerald-900">
                      Direct Health Impact
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-emerald-800 text-[10px]">
                      -{item.estimatedPm25ExposureReductionPct}% PM2.5
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-stone-600 leading-normal">
                    {item.healthImpact}
                  </p>
                </div>

                <div className="rounded-lg border border-stone-200 bg-stone-50 p-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-stone-900">
                      Community Emission Impact
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-stone-800 text-[10px]">
                      +{item.estimatedCo2SavedKgPerWeek} kg CO2/wk
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-stone-600 leading-normal">
                    {item.emissionImpact}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Community Advisory & Sharing Strip */}
      <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
            Community Collective Action Tip
          </div>
          <p className="mt-0.5 text-xs text-stone-800 font-medium">
            {plan.communityTip}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyAlert}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 shadow-2xs transition hover:bg-stone-50 active:scale-95"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-700" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-stone-500" />
              <span>Copy Advisory</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

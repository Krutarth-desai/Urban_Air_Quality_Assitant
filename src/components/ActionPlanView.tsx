"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Activity,
  Leaf,
  Users,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  TrendingUp,
  Shield,
  CheckSquare,
  Square,
  Bookmark,
  LogIn,
  Loader2,
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
  { badge: string; text: string }
> = {
  Easy: {
    badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    text: "text-emerald-400",
  },
  Medium: {
    badge: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    text: "text-amber-400",
  },
  High: {
    badge: "bg-rose-500/10 border-rose-500/30 text-rose-300",
    text: "text-rose-400",
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
    const textToCopy = `🚨 Community Smog Advisory for ${cityName}
Live Air Quality: US AQI ${usAqi}
🍃 Safest Outdoor Window: ${safestWindow}
💡 Action Tip: ${plan.communityTip}

Generated with SmogShield (Urban Air Quality Assistant)`;

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
    <div className="space-y-6">
      {/* 1. Severity & Winter Smog Insight Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Personalized Smog Action Plan
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-slate-300">
              {plan.severitySummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>
                {source === "gemini" ? "AI Model: Gemini 2.5 Flash" : "Deterministic Fallback Plan"}
              </span>
            </div>

            {/* Save Plan to Account Button */}
            {savedSuccess ? (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-300 shadow-sm">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Saved to Account!</span>
              </div>
            ) : authPrompt ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-200 shadow-sm transition hover:bg-amber-500/30"
              >
                <LogIn className="h-3.5 w-3.5 text-amber-300" />
                <span>Sign in to save plans →</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleSavePlan}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/15 px-3.5 py-1 text-xs font-bold text-teal-200 shadow-sm transition hover:bg-teal-500/25 active:scale-95 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5 text-teal-400" />
                    <span>Save Plan to Account</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Smog Inversion Insight Box */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3.5 text-slate-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="text-xs leading-relaxed text-slate-300">
            <strong className="font-semibold text-amber-300">
              Winter Microclimate Insight:{" "}
            </strong>
            {plan.winterSmogInsight}
          </div>
        </div>
      </div>

      {/* 2. Live Direct Impact Meter */}
      <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 p-5 shadow-xl backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-400" />
              <h3 className="text-base font-bold text-white">
                Direct Impact Meter (Live Commitments)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Check off actions below to see your immediate personal and community impact.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-teal-300">
            {committedItems.length} of {allItems.length} Actions Committed
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Personal Health Exposure Reduction */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 text-teal-300">
                <Shield className="h-4 w-4 text-teal-400" />
                Personal Inhaled PM2.5 Reduction
              </span>
              <span className="text-base font-bold text-teal-400">
                ~{totalPm25Reduction}%
              </span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                style={{ width: `${Math.min(totalPm25Reduction, 100)}%` }}
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Cumulative decrease in fine particulate soot entering airway & bloodstream.
            </p>
          </div>

          {/* Community Emissions Prevented */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <Leaf className="h-4 w-4 text-indigo-400" />
                Community CO2 & Tailpipe Reduction
              </span>
              <span className="text-base font-bold text-indigo-400">
                {totalCo2Saved.toFixed(1)} kg / wk
              </span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                style={{
                  width: `${Math.min((totalCo2Saved / 25) * 100, 100)}%`,
                }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Equivalent to cutting ~{(totalCo2Saved * 4.2).toFixed(0)} km of gasoline car driving every week.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Category Tabs */}
      <div className="flex overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 p-1 backdrop-blur-sm scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("routines")}
          className={`flex flex-1 min-w-[170px] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition ${
            activeTab === "routines"
              ? "bg-teal-500/20 text-teal-200 border border-teal-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Daily Routines ({plan.dailyRoutines.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("indoor")}
          className={`flex flex-1 min-w-[170px] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition ${
            activeTab === "indoor"
              ? "bg-teal-500/20 text-teal-200 border border-teal-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Indoor Air Hacks ({plan.indoorHacks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("alternatives")}
          className={`flex flex-1 min-w-[170px] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition ${
            activeTab === "alternatives"
              ? "bg-teal-500/20 text-teal-200 border border-teal-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Leaf className="h-4 w-4" />
          <span>Sustainable Alternatives ({plan.sustainableAlternatives.length})</span>
        </button>
      </div>

      {/* 4. Action Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {currentTabItems.map((item) => {
          const isCommitted = committedIds.has(item.id);
          const diffStyles = DIFFICULTY_STYLES[item.difficulty];

          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-200 ${
                isCommitted
                  ? "border-teal-500/60 ring-1 ring-teal-500/30"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Header row: Checkbox + Title + Badges */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCommit(item.id)}
                    className="mt-0.5 text-teal-400 transition hover:text-teal-300"
                    aria-label={`Commit to ${item.title}`}
                  >
                    {isCommitted ? (
                      <CheckSquare className="h-5 w-5 fill-teal-500/20" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>

                  <div>
                    <h4 className="text-base font-bold text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-start pl-8 sm:pl-0">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                    <Clock className="h-3 w-3 text-teal-400" />
                    {item.timingOrFrequency}
                  </span>
                  <span
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${diffStyles.badge}`}
                  >
                    {item.difficulty}
                  </span>
                </div>
              </div>

              {/* Two-column "Why This Choice Matters" Box */}
              <div className="mt-4 grid grid-cols-1 gap-2.5 pt-3 border-t border-slate-800 sm:grid-cols-2">
                {/* Health Impact */}
                <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                    <Activity className="h-3.5 w-3.5 text-teal-400" />
                    <span>Direct Health Impact</span>
                    <span className="ml-auto text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                      -{item.estimatedPm25ExposureReductionPct}% PM2.5
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    {item.healthImpact}
                  </p>
                </div>

                {/* Community/Emission Impact */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <Leaf className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Community Emission Impact</span>
                    <span className="ml-auto text-[10px] font-extrabold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      +{item.estimatedCo2SavedKgPerWeek} kg CO2/wk
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    {item.emissionImpact}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Community Smog Alert Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 p-5 shadow-xl backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-500/20 p-2.5 text-teal-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Community Collective Action Tip
              </div>
              <p className="mt-1 text-sm font-medium text-slate-200 leading-relaxed">
                {plan.communityTip}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyAlert}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/15 px-4 py-2.5 text-xs font-bold text-teal-200 transition hover:bg-teal-500/25 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-teal-400" />
                <span>Copy Alert for WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

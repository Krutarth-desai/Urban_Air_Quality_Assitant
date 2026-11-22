"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  AlertCircle,
  Shield,
  Bookmark,
  LogIn,
  Loader2,
  Check,
  Leaf,
} from "lucide-react";
import { ImpactMeter } from "./plan/ImpactMeter";
import { RoutineChecklist } from "./plan/RoutineChecklist";
import { CommunityShareCard } from "./plan/CommunityShareCard";
import { IMPACT_CONSTANTS } from "@/lib/aqi-utils";
import type { ActionItem, GeneratedActionPlan } from "@/types/smogshield";

interface ActionPlanViewProps {
  plan: GeneratedActionPlan;
  cityName: string;
  usAqi: number;
  safestWindow: string;
  source?: "gemini" | "fallback";
}

type TabType = "routines" | "indoor" | "alternatives";

/**
 * Main coordinator view for personalized particulate mitigation plans.
 */
export function ActionPlanView({
  plan,
  cityName,
  usAqi,
  safestWindow,
  source = "gemini",
}: ActionPlanViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("routines");
  const [committedIds, setCommittedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (plan.dailyRoutines[0]) initial.add(plan.dailyRoutines[0].id);
    if (plan.indoorHacks[0]) initial.add(plan.indoorHacks[0].id);
    return initial;
  });
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

  const allItems: ActionItem[] = [
    ...plan.dailyRoutines,
    ...plan.indoorHacks,
    ...plan.sustainableAlternatives,
  ];

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
    IMPACT_CONSTANTS.MAX_REALISTIC_EXPOSURE_REDUCTION_PCT
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

      {/* 2. Direct Impact Progress Bars */}
      <ImpactMeter
        totalPm25Reduction={totalPm25Reduction}
        totalCo2Saved={totalCo2Saved}
        activeCount={committedItems.length}
        totalCount={allItems.length}
      />

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

      {/* 4. Action Checklist */}
      <RoutineChecklist
        items={currentTabItems}
        committedIds={committedIds}
        onToggleCommit={toggleCommit}
      />

      {/* 5. Community Advisory & Sharing */}
      <CommunityShareCard
        communityTip={plan.communityTip}
        cityName={cityName}
        usAqi={usAqi}
        safestWindow={safestWindow}
      />
    </div>
  );
}

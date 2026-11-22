"use client";

import React from "react";
import { Clock, CheckSquare, Square } from "lucide-react";
import { DIFFICULTY_STYLES } from "@/lib/aqi-utils";
import type { ActionItem } from "@/types/smogshield";

interface RoutineChecklistProps {
  items: ActionItem[];
  committedIds: Set<string>;
  onToggleCommit: (id: string) => void;
}

/**
 * Interactive checklist of mitigation action items with health & emission explanations.
 */
export function RoutineChecklist({
  items,
  committedIds,
  onToggleCommit,
}: RoutineChecklistProps) {
  return (
    <div className="divide-y divide-stone-200">
      {items.map((item) => {
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
                  onClick={() => onToggleCommit(item.id)}
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
  );
}

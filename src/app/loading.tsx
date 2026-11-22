import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Lightweight instant skeleton loader for App Router page transitions.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6 animate-pulse">
      {/* Telemetry Bar Skeleton */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 pb-5 border-b border-stone-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-9 w-64 rounded-lg bg-stone-100" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-lg bg-stone-100" />
            <div className="h-8 w-40 rounded-lg bg-stone-100" />
          </div>
        </div>

        <div className="pt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 space-y-2">
            <div className="h-4 w-32 rounded bg-stone-100" />
            <div className="h-10 w-24 rounded bg-stone-200" />
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="h-16 rounded-lg bg-stone-100" />
            <div className="h-16 rounded-lg bg-stone-100" />
            <div className="h-16 rounded-lg bg-stone-100" />
            <div className="h-16 rounded-lg bg-stone-100" />
          </div>
        </div>
      </div>

      {/* 2-Column Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
        <div className="lg:col-span-4 rounded-xl border border-stone-200 bg-white p-5 space-y-4">
          <div className="h-4 w-40 rounded bg-stone-100" />
          <div className="h-28 rounded-lg bg-stone-100" />
          <div className="h-20 rounded-lg bg-stone-100" />
        </div>
        <div className="lg:col-span-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-400">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400 mb-2" />
          <span className="text-xs font-mono">Calibrating atmospheric model...</span>
        </div>
      </div>
    </div>
  );
}

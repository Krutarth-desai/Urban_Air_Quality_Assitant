"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CommunityShareCardProps {
  communityTip: string;
  cityName: string;
  usAqi: number;
  safestWindow: string;
}

/**
 * Community advisory card with one-click clipboard copying for neighborhood sharing.
 */
export function CommunityShareCard({
  communityTip,
  cityName,
  usAqi,
  safestWindow,
}: CommunityShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAlert = async () => {
    const textToCopy = `🚨 Atmospheric Advisory for ${cityName}
Live Air Quality: US AQI ${usAqi}
🍃 Safest Outdoor Window: ${safestWindow}
💡 Action Tip: ${communityTip}

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

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-stone-500 font-mono">
          Community Collective Action Tip
        </div>
        <p className="mt-0.5 text-xs text-stone-800 font-medium">
          {communityTip}
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
  );
}

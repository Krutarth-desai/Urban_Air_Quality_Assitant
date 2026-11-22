"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeletePlanButtonProps {
  planId: string;
}

export function DeletePlanButton({ planId }: DeletePlanButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this saved plan?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/plans?id=${encodeURIComponent(planId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Unable to delete plan. Please try again.");
      }
    } catch (err) {
      console.error("Failed to delete plan:", err);
      alert("Error deleting plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-rose-500/50 hover:bg-rose-950/40 hover:text-rose-300 disabled:opacity-50"
      aria-label="Delete saved plan"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
      ) : (
        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
      )}
      <span className="hidden sm:inline">Delete</span>
    </button>
  );
}

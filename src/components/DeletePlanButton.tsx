"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeletePlanButtonProps {
  planId: string;
}

/**
 * Action button to delete a saved plan with confirmation prompt and loading spinner.
 */
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
      className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
      aria-label="Delete saved plan"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin text-stone-500" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
      <span className="hidden sm:inline">Delete</span>
    </button>
  );
}

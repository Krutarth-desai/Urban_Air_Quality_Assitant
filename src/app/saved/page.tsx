import React from "react";
import Link from "next/link";
import { Bookmark, ArrowLeft, Shield, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function SavedPlansPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.warn("Could not fetch user:", err);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-teal-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Live Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal-500/20 p-2.5 text-teal-300">
          <Bookmark className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Your Saved Smog Plans</h1>
          <p className="text-xs text-slate-400">
            {user ? `Logged in as ${user.email}` : "Log in to synchronize your saved mitigation plans."}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm sm:p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-teal-400">
          <Shield className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-bold text-white">
          No cloud plans saved yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
          Generate an action plan on the live dashboard and click &quot;Commit&quot; to track your daily routines and indoor hacks across sessions.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:from-teal-400 hover:to-emerald-400"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate New Plan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

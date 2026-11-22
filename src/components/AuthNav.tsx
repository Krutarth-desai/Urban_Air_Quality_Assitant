import React from "react";
import Link from "next/link";
import { User, LogIn, LogOut, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/login/actions";

/**
 * Server Component rendering user authentication controls in the top navigation.
 */
export async function AuthNav() {
  let user = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    // Graceful fallback if Supabase credentials are not configured yet
    console.warn("[AuthNav] Could not fetch session:", err);
  }

  if (user) {
    return (
      <div className="flex items-center gap-2.5 text-xs">
        <Link
          href="/saved"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 font-medium text-slate-200 transition hover:border-teal-500/50 hover:bg-slate-800 hover:text-teal-300"
        >
          <Bookmark className="h-3.5 w-3.5 text-teal-400" />
          <span className="hidden sm:inline">Saved Plans</span>
        </Link>

        <div className="flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-medium text-teal-300">
          <User className="h-3.5 w-3.5" />
          <span className="max-w-[110px] truncate sm:max-w-[160px]">
            {user.email}
          </span>
        </div>

        <form action={signout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-medium text-slate-300 transition hover:border-rose-500/50 hover:bg-rose-950/30 hover:text-rose-300"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/15 px-3.5 py-1.5 text-xs font-bold text-teal-200 shadow-sm transition hover:bg-teal-500/25 active:scale-95"
    >
      <LogIn className="h-3.5 w-3.5 text-teal-400" />
      <span>Sign In / Save Profile</span>
    </Link>
  );
}

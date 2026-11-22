import React from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
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
    console.warn("[AuthNav] Could not fetch session:", err);
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <Link
          href="/saved"
          className="font-medium text-stone-700 hover:text-stone-950 transition rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        >
          Saved Plans
        </Link>

        <span className="hidden font-mono text-stone-600 sm:inline max-w-[140px] truncate">
          {user.email}
        </span>

        <form action={signout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 font-medium text-stone-700 shadow-xs hover:bg-stone-50 hover:text-stone-950 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            aria-label="Sign out of account"
          >
            <LogOut className="h-3 w-3" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-900 shadow-xs hover:border-stone-400 hover:bg-stone-50 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
    >
      Sign In
    </Link>
  );
}

"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { login, signup, type AuthState } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Bridge action to route dynamically between signin and signup
  async function handleAuthAction(
    prevState: AuthState | null,
    formData: FormData
  ): Promise<AuthState> {
    const currentMode = formData.get("auth_mode") as string;
    if (currentMode === "signup") {
      return signup(prevState, formData);
    }
    return login(prevState, formData);
  }

  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    handleAuthAction,
    null
  );

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header Icon & Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {mode === "signin" ? "Sign in to SmogShield" : "Create your account"}
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Save personalized household smog action plans and track cumulative community emissions.
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          {/* Mode Switcher Tabs */}
          <div className="mb-6 flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "signin"
                  ? "bg-teal-500/20 text-teal-200 shadow-sm border border-teal-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "signup"
                  ? "bg-teal-500/20 text-teal-200 shadow-sm border border-teal-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Accessible Error / Feedback Banner */}
          {state?.error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 text-xs text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div className="leading-relaxed">{state.error}</div>
            </div>
          )}

          {state?.success && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-300"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div className="leading-relaxed">{state.success}</div>
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="auth_mode" value={mode} />

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                />
              </div>
              {mode === "signup" && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Must be at least 6 characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-slate-950 shadow-md shadow-teal-500/20 transition hover:from-teal-400 hover:via-emerald-400 hover:to-teal-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {mode === "signin"
                      ? "Signing in..."
                      : "Creating account..."}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {mode === "signin" ? "Sign In" : "Create Account"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Guest Link */}
          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-teal-300"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import {
  Wind,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { login, signup, type AuthState } from "./actions";

/**
 * User authentication page with Sign In / Sign Up toggle and Guest Mode bypass.
 */
export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Dynamic server action bridge based on auth_mode
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
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[#F6F6F3] px-4 py-12">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#164E3B] text-white">
            <Wind className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-950 sm:text-2xl">
            {mode === "signin" ? "Sign in to SmogShield" : "Create Account"}
          </h1>
          <p className="text-xs text-stone-600 max-w-xs mx-auto">
            Synchronize household profile parameters and cloud-save tailored mitigation plans.
          </p>
        </div>

        {/* Card */}
        <div className="w-full rounded-xl border border-stone-200/90 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {/* Segmented Flat Toggle with Tablist Role */}
          <div
            role="tablist"
            aria-label="Account Action Selection"
            className="mb-6 grid grid-cols-2 rounded-lg bg-stone-100 p-1 border border-stone-200/80"
          >
            <button
              type="button"
              role="tab"
              id="tab-signin"
              aria-selected={mode === "signin"}
              aria-controls="auth-form"
              onClick={() => setMode("signin")}
              className={`rounded-md py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                mode === "signin"
                  ? "bg-white text-stone-950 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              id="tab-signup"
              aria-selected={mode === "signup"}
              aria-controls="auth-form"
              onClick={() => setMode("signup")}
              className={`rounded-md py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                mode === "signup"
                  ? "bg-white text-stone-950 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Accessible Error Banner */}
          {state?.error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
              <div className="leading-relaxed">{state.error}</div>
            </div>
          )}

          {/* Accessible Success Banner */}
          {state?.success && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              <div className="leading-relaxed">{state.success}</div>
            </div>
          )}

          {/* Auth Form */}
          <form
            id="auth-form"
            action={formAction}
            aria-busy={isPending}
            className="space-y-4"
          >
            <input type="hidden" name="auth_mode" value={mode} />

            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-medium uppercase tracking-wider text-stone-700 font-mono"
              >
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-stone-300 bg-stone-50/50 py-2 pl-9 pr-3 text-sm text-stone-950 placeholder:text-stone-500 focus:bg-white focus:border-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-medium uppercase tracking-wider text-stone-700 font-mono"
              >
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-stone-300 bg-stone-50/50 py-2 pl-9 pr-3 text-sm text-stone-950 placeholder:text-stone-500 focus:bg-white focus:border-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 transition"
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-600">
                Minimum 6 characters required.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#164E3B] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#113D2E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "signin"
                      ? "Sign In to Account"
                      : "Create Free Account"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Understated Guest Option */}
          <div className="mt-6 border-t border-stone-100 pt-4 text-center">
            <Link
              href="/"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 transition rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              Continue without an account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error: string | null;
  success: string | null;
}

/**
 * Server Action for authenticating an existing user via Supabase.
 */
export async function login(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      error: "Please enter both email and password.",
      success: null,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: error.message,
        success: null,
      };
    }
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Authentication service unavailable";
    return {
      error:
        msg.includes("fetch failed") || msg.includes("placeholder")
          ? "Supabase is not configured yet. Add your SUPABASE credentials to .env.local or click 'Continue as Guest'."
          : msg,
      success: null,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Server Action for registering a new user via Supabase.
 */
export async function signup(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      error: "Please enter both email and password.",
      success: null,
    };
  }

  if (password.length < 6) {
    return {
      error: "Password must be at least 6 characters long.",
      success: null,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return {
        error: error.message,
        success: null,
      };
    }
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Authentication service unavailable";
    return {
      error:
        msg.includes("fetch failed") || msg.includes("placeholder")
          ? "Supabase is not configured yet. Add your SUPABASE credentials to .env.local or click 'Continue as Guest'."
          : msg,
      success: null,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Server Action for ending the active user session.
 */
export async function signout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

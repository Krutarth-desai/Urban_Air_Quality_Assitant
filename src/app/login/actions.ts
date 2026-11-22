"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCredentialsSchema } from "@/lib/schemas";

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

  const validation = AuthCredentialsSchema.safeParse({ email, password });
  if (!validation.success) {
    return {
      error:
        validation.error.issues[0]?.message || "Invalid credentials provided.",
      success: null,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
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

  const validation = AuthCredentialsSchema.safeParse({ email, password });
  if (!validation.success) {
    return {
      error:
        validation.error.issues[0]?.message || "Invalid credentials provided.",
      success: null,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, signup, signout } from "@/app/login/actions";

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock next/cache revalidatePath
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string, type?: string) =>
    mockRevalidatePath(path, type),
}));

// Mock Supabase server client
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(() =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
        signOut: mockSignOut,
      },
    })
  ),
}));

describe("Authentication Server Actions (src/app/login/actions.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login action", () => {
    it("rejects invalid email formats without calling Supabase", async () => {
      const formData = new FormData();
      formData.append("email", "invalid-email-address");
      formData.append("password", "validPassword123");

      const result = await login(null, formData);

      expect(result.error).toContain("valid email address");
      expect(result.success).toBeNull();
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("rejects passwords under 8 characters without calling Supabase", async () => {
      const formData = new FormData();
      formData.append("email", "resident@smogshield.org");
      formData.append("password", "short1");

      const result = await login(null, formData);

      expect(result.error).toContain("at least 8 characters");
      expect(result.success).toBeNull();
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("returns error message when Supabase authentication fails", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Invalid login credentials" },
      });

      const formData = new FormData();
      formData.append("email", "resident@smogshield.org");
      formData.append("password", "wrongPassword123");

      const result = await login(null, formData);

      expect(result.error).toBe("Invalid login credentials");
      expect(result.success).toBeNull();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("handles unexpected network or configuration exceptions gracefully", async () => {
      mockSignInWithPassword.mockRejectedValueOnce(
        new Error("fetch failed placeholder")
      );

      const formData = new FormData();
      formData.append("email", "resident@smogshield.org");
      formData.append("password", "validPassword123");

      const result = await login(null, formData);

      expect(result.error).toContain("Supabase is not configured yet");
      expect(result.success).toBeNull();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("revalidates path and redirects to '/' on successful sign in", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });

      const formData = new FormData();
      formData.append("email", "resident@smogshield.org");
      formData.append("password", "validPassword123");

      await login(null, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });
  });

  describe("signup action", () => {
    it("rejects invalid email formats on registration", async () => {
      const formData = new FormData();
      formData.append("email", "bad-format");
      formData.append("password", "securePass123");

      const result = await signup(null, formData);

      expect(result.error).toContain("valid email address");
      expect(mockSignUp).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("rejects short passwords (< 8 characters) on registration", async () => {
      const formData = new FormData();
      formData.append("email", "newuser@smogshield.org");
      formData.append("password", "pass1");

      const result = await signup(null, formData);

      expect(result.error).toContain("at least 8 characters");
      expect(mockSignUp).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("returns error message when Supabase registration fails", async () => {
      mockSignUp.mockResolvedValueOnce({
        error: { message: "User already registered" },
      });

      const formData = new FormData();
      formData.append("email", "existing@smogshield.org");
      formData.append("password", "securePassword123");

      const result = await signup(null, formData);

      expect(result.error).toBe("User already registered");
      expect(result.success).toBeNull();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("revalidates path and redirects to '/' on successful registration", async () => {
      mockSignUp.mockResolvedValueOnce({ error: null });

      const formData = new FormData();
      formData.append("email", "newresident@smogshield.org");
      formData.append("password", "securePassword123");

      await signup(null, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });
  });

  describe("signout action", () => {
    it("signs out active session and redirects to '/'", async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });

      await signout();

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });
  });
});

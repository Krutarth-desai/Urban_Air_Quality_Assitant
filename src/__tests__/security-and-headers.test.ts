import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

describe("HTTP Security Headers Configuration (next.config.ts)", () => {
  it("defines an asynchronous headers configuration function", async () => {
    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe("function");
  });

  it("configures mandatory security headers matching production standards for all routes", async () => {
    const headerRules = await nextConfig.headers!();
    expect(headerRules).toBeDefined();
    expect(headerRules.length).toBeGreaterThan(0);

    const rootWildcardRule = headerRules.find((rule) => rule.source === "/(.*)");
    expect(rootWildcardRule).toBeDefined();

    const headersMap = new Map(
      rootWildcardRule!.headers.map((h) => [h.key, h.value])
    );

    // 1. Strict-Transport-Security (HSTS with subdomains and preload)
    expect(headersMap.has("Strict-Transport-Security")).toBe(true);
    const hsts = headersMap.get("Strict-Transport-Security")!;
    expect(hsts).toContain("max-age=63072000");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");

    // 2. MIME sniffing prevention (X-Content-Type-Options: nosniff)
    expect(headersMap.has("X-Content-Type-Options")).toBe(true);
    expect(headersMap.get("X-Content-Type-Options")).toBe("nosniff");

    // 3. Clickjacking protection (X-Frame-Options: DENY)
    expect(headersMap.has("X-Frame-Options")).toBe(true);
    expect(headersMap.get("X-Frame-Options")).toBe("DENY");

    // 4. Referrer Policy
    expect(headersMap.has("Referrer-Policy")).toBe(true);
    expect(headersMap.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );

    // 5. Content Security Policy (CSP)
    expect(headersMap.has("Content-Security-Policy")).toBe(true);
    const csp = headersMap.get("Content-Security-Policy")!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://*.supabase.co");
    expect(csp).toContain("https://*.open-meteo.com");
    expect(csp).toContain("https://fonts.googleapis.com");

    // 6. Permissions Policy
    expect(headersMap.has("Permissions-Policy")).toBe(true);
    const permissions = headersMap.get("Permissions-Policy")!;
    expect(permissions).toContain("camera=()");
    expect(permissions).toContain("microphone=()");
  });
});

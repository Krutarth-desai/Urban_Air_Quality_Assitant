import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { appCache } from "../lib/cache";
import { checkRateLimit, getClientIp } from "../lib/rate-limit";

describe("MemoryTTLCache (appCache)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for non-existent keys", () => {
    expect(appCache.get("unknown-key-123")).toBeNull();
  });

  it("stores and retrieves cached values within TTL window", () => {
    appCache.set("station:delhi", { aqi: 180, pm25: 120 }, 5000);
    const cached = appCache.get<{ aqi: number; pm25: number }>("station:delhi");
    expect(cached).toEqual({ aqi: 180, pm25: 120 });
  });

  it("expires and deletes keys after TTL duration passes", () => {
    appCache.set("geo:beijing", { lat: 39.9, lon: 116.4 }, 2000);

    // Fast-forward 1 second - should still be valid
    vi.advanceTimersByTime(1000);
    expect(appCache.get("geo:beijing")).not.toBeNull();

    // Fast-forward past 2 seconds - should expire
    vi.advanceTimersByTime(1500);
    expect(appCache.get("geo:beijing")).toBeNull();
  });

  it("evicts oldest key when exceeding max capacity", () => {
    // Fill cache up to capacity
    for (let i = 0; i < 205; i++) {
      appCache.set(`key-${i}`, `val-${i}`, 60_000);
    }
    // Very first key should have been evicted
    expect(appCache.get("key-0")).toBeNull();
    // Recent key should remain
    expect(appCache.get("key-204")).toBe("val-204");
  });
});

describe("checkRateLimit & getClientIp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("permits requests within quota limit", () => {
    const ip = "192.168.1.10";
    const res1 = checkRateLimit(`test-route:${ip}`, 3, 10_000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(`test-route:${ip}`, 3, 10_000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(`test-route:${ip}`, 3, 10_000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests exceeding quota limit and reports retryAfterSec", () => {
    const ip = "10.0.0.5";
    // Exhaust 2 requests
    checkRateLimit(`quota:${ip}`, 2, 5_000);
    checkRateLimit(`quota:${ip}`, 2, 5_000);

    // 3rd attempt should be rejected
    const blocked = checkRateLimit(`quota:${ip}`, 2, 5_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets rate limit window after windowMs elapses", () => {
    const ip = "172.16.0.2";
    checkRateLimit(`timer:${ip}`, 1, 3_000);

    const blocked = checkRateLimit(`timer:${ip}`, 1, 3_000);
    expect(blocked.allowed).toBe(false);

    // Fast-forward past 3 seconds
    vi.advanceTimersByTime(3500);

    const allowedAgain = checkRateLimit(`timer:${ip}`, 1, 3_000);
    expect(allowedAgain.allowed).toBe(true);
  });

  it("extracts client IP from various HTTP headers", () => {
    const reqWithForwarded = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(reqWithForwarded)).toBe("203.0.113.195");

    const reqWithRealIp = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.14" },
    });
    expect(getClientIp(reqWithRealIp)).toBe("198.51.100.14");

    const reqEmpty = new Request("http://localhost/api/test");
    expect(getClientIp(reqEmpty)).toBe("anonymous");
  });
});

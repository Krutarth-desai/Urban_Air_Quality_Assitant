/**
 * Fixed-window IP-based rate limiter for API routes.
 * Prevents abuse and protects Gemini API quota.
 */
interface RateRecord {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateRecord>();

/**
 * Checks whether an incoming client request is within the allowed quota.
 *
 * @param identifier - Unique client identifier (e.g., client IP or route prefix)
 * @param limit - Maximum requests allowed within window (default 15)
 * @param windowMs - Time window duration in milliseconds (default 60,000)
 * @returns Object indicating whether request is allowed, remaining quota, and retry wait time in seconds
 */
export function checkRateLimit(
  identifier: string,
  limit = 15,
  windowMs = 60_000
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const record = ipStore.get(identifier);

  if (!record || now > record.resetAt) {
    ipStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    retryAfterSec: 0,
  };
}

/**
 * Extracts client IP address from proxy forwarding headers.
 *
 * @param request - Incoming HTTP Request object
 * @returns Client IP string or "anonymous" fallback
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "anonymous";
}

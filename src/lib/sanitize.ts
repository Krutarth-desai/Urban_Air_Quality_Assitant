import { NextResponse } from "next/server";

/**
 * Sanitizes user-supplied input text to prevent prompt injection, control character abuse,
 * and breakout from XML/tag context boundaries.
 *
 * @param text - Raw user-supplied string
 * @param maxLength - Maximum permitted character count
 * @returns Sanitized and bounded string
 */
export function sanitizeUserInput(text: string, maxLength = 500): string {
  if (typeof text !== "string") return "";

  return text
    // Strip non-printable ASCII control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Neutralize XML / tag delimiters so user text cannot break out of prompt context blocks
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim()
    .slice(0, maxLength);
}

/**
 * Parses JSON request bodies with an explicit size limit guard to prevent DoS.
 * Rejects oversized payloads with HTTP 413 before heavy processing and catches malformed JSON with HTTP 400.
 *
 * @param request - Incoming HTTP Request
 * @param maxBytes - Maximum permitted body size in bytes (default 65,536 = 64KB)
 * @returns Parsed JSON data or an immediate NextResponse error
 */
export async function parseJsonBody<T = unknown>(
  request: Request,
  maxBytes = 65_536
): Promise<
  | { data: T; errorResponse?: never }
  | { data?: never; errorResponse: NextResponse }
> {
  const headerLength = Number(request.headers.get("content-length") || 0);
  if (headerLength > maxBytes) {
    return {
      errorResponse: NextResponse.json(
        { error: "Payload too large. Request body exceeds permitted size." },
        { status: 413 }
      ),
    };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return {
      errorResponse: NextResponse.json(
        { error: "Unable to read request payload." },
        { status: 400 }
      ),
    };
  }

  if (text.length > maxBytes) {
    return {
      errorResponse: NextResponse.json(
        { error: "Payload too large. Request body exceeds permitted size." },
        { status: 413 }
      ),
    };
  }

  try {
    const data = JSON.parse(text) as T;
    return { data };
  } catch {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid JSON format in request body." },
        { status: 400 }
      ),
    };
  }
}

import { NextResponse } from "next/server";
import { ChatRequestSchema } from "@/lib/schemas";
import { generateSmogChatReply, buildFallbackChatReply } from "@/lib/gemini";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { parseJsonBody, sanitizeUserInput } from "@/lib/sanitize";

/**
 * POST /api/chat
 *
 * Smog Coach conversational consultant endpoint. Validates messages with Zod,
 * guards payload size, neutralizes XML/tag delimiters to prevent prompt injection,
 * and falls back to deterministic guidance if AI quota is exhausted.
 *
 * @param request - Incoming Next.js HTTP request containing user message and context
 * @returns JSON response with assistant reply and fallback status
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`chat:${ip}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many chat messages. Please pause briefly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const { data: body, errorResponse } = await parseJsonBody(request, 32_768);
  if (errorResponse) return errorResponse;

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[SmogCoach Validation Warning]:", parsed.error.format());
    return NextResponse.json(
      { error: "Please enter a valid question (up to 500 characters)." },
      { status: 400 }
    );
  }

  // Sanitize all user-controlled text strings to prevent XML breakout or injection
  const sanitizedParams = {
    message: sanitizeUserInput(parsed.data.message, 500),
    city: sanitizeUserInput(parsed.data.city, 100),
    usAqi: parsed.data.usAqi,
    pm25: parsed.data.pm25,
    householdSummary: sanitizeUserInput(parsed.data.householdSummary || "", 500),
    history: parsed.data.history?.map((h) => ({
      role: h.role,
      content: sanitizeUserInput(h.content, 1000),
    })),
  };

  try {
    const result = await generateSmogChatReply(sanitizedParams);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[SmogCoach API Error]", err);
    // Graceful fallback response instead of failing with a 500 or leaking internal error
    const fallbackReply = buildFallbackChatReply(sanitizedParams);
    return NextResponse.json({
      reply: fallbackReply,
      fallback: true,
    });
  }
}

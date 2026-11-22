import { NextResponse } from "next/server";
import { ChatRequestSchema } from "@/lib/schemas";
import { generateSmogChatReply, buildFallbackChatReply } from "@/lib/gemini";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/chat
 *
 * Smog Coach conversational consultant endpoint. Validates messages with Zod,
 * wraps questions with XML delimiters to protect against prompt injection,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[SmogCoach Validation Warning]:", parsed.error.format());
    return NextResponse.json(
      { error: "Please enter a valid question (up to 500 characters)." },
      { status: 400 }
    );
  }

  try {
    const result = await generateSmogChatReply(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[SmogCoach API Error]", err);
    // Graceful fallback response instead of failing with a 500
    const fallbackReply = buildFallbackChatReply(parsed.data);
    return NextResponse.json({
      reply: fallbackReply,
      fallback: true,
    });
  }
}

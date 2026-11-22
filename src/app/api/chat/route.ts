import { NextResponse } from "next/server";
import { ChatRequestSchema } from "@/lib/schemas";
import { generateSmogChatReply } from "@/lib/gemini";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`chat:${ip}`, 15, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many chat messages. Please pause briefly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid question (2-500 characters)." },
        { status: 400 }
      );
    }

    const reply = await generateSmogChatReply(parsed.data);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[/api/chat] Error:", error);
    return NextResponse.json(
      { error: "Smog Coach is temporarily unavailable." },
      { status: 500 }
    );
  }
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface SmogCoachChatProps {
  city: string;
  usAqi: number;
  pm25: number;
  householdSummary: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  "Is it safe for my kids to play outside today?",
  "How do I seal my apartment during severe smog?",
  "Best low-cost mask & purifier tips for winter?",
];

function createChatMessage(role: "user" | "assistant", content: string): Message {
  const d = new Date();
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return {
    id: `${role[0]}-${d.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    timestamp: time,
  };
}

export function SmogCoachChat({
  city,
  usAqi,
  pm25,
  householdSummary,
}: SmogCoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content: `Hello! I'm your SmogShield AI Coach. In ${city}, today's AQI is ${usAqi} (PM2.5: ${pm25} µg/m³). Ask me anything about winter smog protection, indoor ventilation, mask fit, or low-emission commute routines.`,
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend ?? input).trim();
    if (!text || loading) return;
    if (text.length > 500) {
      setError("Please keep your message under 500 characters.");
      return;
    }

    setError(null);
    setInput("");

    const userMsg = createChatMessage("user", text);
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          city,
          usAqi,
          pm25,
          householdSummary,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error || "Failed to reach Smog Coach");
      }

      const data = (await res.json()) as { reply: string };
      const botMsg = createChatMessage("assistant", data.reply);
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      const msg = err instanceof Error ? err.message : "Unable to reach coach";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[520px] flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-teal-500/20 p-1.5 text-teal-300">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Smog Coach (Gemini AI)
              </h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-400">
              Context: {city} | AQI {usAqi} | {householdSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                  isUser
                    ? "bg-teal-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-teal-300 border border-slate-700"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-teal-600 text-white rounded-tr-none"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                <div
                  className={`mt-1 text-[10px] ${
                    isUser ? "text-teal-200/80 text-right" : "text-slate-400"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5 text-slate-400 text-xs pl-2">
            <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
            <span>Smog Coach is formulating tailored scientific advice...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompt Chips */}
      <div className="border-t border-slate-800/80 bg-slate-950/40 px-3.5 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <Sparkles className="h-3 w-3 shrink-0 text-teal-400" />
          <span className="text-[10px] font-semibold uppercase text-slate-400 shrink-0">
            Suggestions:
          </span>
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="shrink-0 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-teal-500/50 hover:bg-slate-700 hover:text-teal-200 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="border-t border-slate-800 p-3 bg-slate-950/60"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              maxLength={500}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about masks, room sealing, exercise safety..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 sm:text-sm"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
              {input.length}/500
            </span>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-slate-950 transition hover:bg-teal-400 disabled:opacity-40"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

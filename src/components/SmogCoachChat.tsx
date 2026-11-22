"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  AlertCircle,
  Activity,
  User,
  Shield,
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
  "Is it safe for children to engage in outdoor exertion today?",
  "What is the best procedure to seal window drafts against fine soot?",
  "How effective is a DIY Corsi-Rosenthal box vs commercial HEPA?",
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
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive initial greeting directly from telemetry props
  const initialGreeting: Message = {
    id: "initial",
    role: "assistant",
    content: `Hello. Ground-level telemetry for ${city} reports US AQI ${usAqi} (PM2.5: ${pm25} µg/m³). Ask any question regarding particulate exposure timing, mask filtration performance, room sealing, or low-emission commute shifts.`,
    timestamp: "Live",
  };

  const allMessages = [initialGreeting, ...conversation];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, loading]);

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
    setConversation((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const historyPayload = conversation
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          city,
          usAqi,
          pm25,
          householdSummary,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error || "Failed to reach consultation server");
      }

      const data = (await res.json()) as { reply: string; fallback?: boolean };
      const botMsg = createChatMessage("assistant", data.reply);
      setConversation((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      const msg =
        err instanceof Error ? err.message : "Unable to reach consultant";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-stone-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-stone-200 px-4 py-3 bg-stone-50/70">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-stone-800" />
          <h4 className="text-xs font-semibold text-stone-900 tracking-tight">
            Environmental Health Consultation
          </h4>
        </div>
        <div className="font-mono text-[11px] text-stone-500">
          Telemetry: {city} • AQI {usAqi}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 max-h-[420px] overflow-y-auto p-4 space-y-3">
        {allMessages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-semibold ${
                  isUser
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-700 border border-stone-200"
                }`}
              >
                {isUser ? <User className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              </div>

              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-900 border border-stone-200/60"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.timestamp && (
                  <div
                    className={`mt-1 font-mono text-[10px] ${
                      isUser ? "text-stone-400 text-right" : "text-stone-500"
                    }`}
                  >
                    {m.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-stone-500 text-xs pl-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-700" />
            <span>Consulting atmospheric exposure guidelines...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Suggestions with clean flex-wrap */}
      <div className="shrink-0 border-t border-stone-200 bg-stone-50/50 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase text-stone-500 shrink-0 mr-1">
            Questions:
          </span>
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="rounded border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700 transition hover:bg-stone-100 hover:text-stone-950 disabled:opacity-50 text-left font-medium shadow-2xs"
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
        className="shrink-0 border-t border-stone-200 p-3 bg-white"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              maxLength={500}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask regarding ventilation times, mask fit, or indoor filtration..."
              className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:outline-none transition sm:text-sm"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-stone-400">
              {input.length}/500
            </span>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#164E3B] text-white transition hover:bg-[#113D2E] disabled:opacity-40"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

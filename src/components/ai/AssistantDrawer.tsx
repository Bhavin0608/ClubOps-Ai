"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PendingActionCard, PendingActionData } from "./PendingActionCard";
import { CitationList, CitationItem } from "./CitationList";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Wrench,
  ChevronRight,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { FormattedMessage } from "@/components/shared/FormattedMessage";
import { cn } from "@/lib/utils";

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolTrace?: { tool: string; args?: unknown }[];
  citations?: CitationItem[];
  stagedActions?: PendingActionData[];
}

interface AssistantDrawerProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const SUGGESTED_PROMPTS = [
  "What should I focus on right now?",
  "Who is overloaded?",
  'Assign the task "Finalize volunteer shift roster" to Rahul',
  "What does the venue agreement say about capacity?",
  'Move "Confirm venue booking" deadline to Friday and assign it to Rahul',
  "Remember that Rahul is the lead for logistics",
];

export function AssistantDrawer({
  eventId,
  isOpen,
  onClose,
  initialPrompt,
}: AssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your ClubOps AI Assistant. I can analyze operational risks, answer questions with exact database facts, execute task & volunteer CRUD, and stage confirmed actions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load persistent chat history from DB on open
  useEffect(() => {
    if (isOpen && eventId) {
      fetch(`/api/ai/chat?eventId=${eventId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const loaded: ChatMessageItem[] = data.map((m: any) => ({
              id: m.id,
              role: m.role.toLowerCase() as "user" | "assistant",
              content: m.content,
              toolTrace: m.toolTrace ?? undefined,
              citations: m.citations ?? undefined,
            }));
            setMessages(loaded);
          }
        })
        .catch((err) => console.error("Failed to load chat history:", err));
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleClearHistory = async () => {
    if (clearing || loading) return;
    setClearing(true);
    try {
      await fetch(`/api/ai/chat?eventId=${eventId}`, { method: "DELETE" });
      setMessages([
        {
          id: "welcome_fresh",
          role: "assistant",
          content: "Chat history cleared. How can I assist you with this event?",
        },
      ]);
    } catch (err) {
      console.error("Failed to clear chat:", err);
    } finally {
      setClearing(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const userMessage: ChatMessageItem = {
      id: `user_${Date.now()}`,
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, message: messageText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to communicate with assistant");
      }

      const assistantMessage: ChatMessageItem = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: data.text,
        toolTrace: data.toolTrace,
        citations: data.citations,
        stagedActions: data.stagedActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `Notice: ${err.message || "Could not complete operation."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              ClubOps AI Assistant
              <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                PROD
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Continuous Memory & Tool Executor</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            disabled={clearing}
            title="Clear Chat History"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className={cn("w-4 h-4", clearing && "animate-spin text-blue-400")} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested prompts carousel / bar */}
      <div className="px-4 py-2.5 bg-slate-900/30 border-b border-slate-800/80 overflow-x-auto whitespace-nowrap flex gap-2 no-scrollbar">
        {SUGGESTED_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 hover:bg-blue-600/20 hover:text-blue-300 hover:border-blue-500/40 border border-slate-700/60 transition-all cursor-pointer flex-shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-3 text-sm",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex-shrink-0 flex items-center justify-center text-blue-400 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={cn(
                "rounded-2xl px-4 py-3 max-w-[85%] leading-relaxed",
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none shadow-md"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
              )}
            >
              {/* Tool Execution Trace Chips */}
              {m.toolTrace && m.toolTrace.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {m.toolTrace.map((tr, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-400"
                    >
                      <Wrench className="w-2.5 h-2.5 text-blue-400" />
                      {tr.tool}
                    </span>
                  ))}
                </div>
              )}

              {/* Message Formatted Content */}
              <div className="leading-relaxed">
                {m.role === "assistant" ? (
                  <FormattedMessage content={m.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>

              {/* Verified Document Citations */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800">
                  <CitationList citations={m.citations} />
                </div>
              )}

              {/* Staged Consequential Actions (Human Confirmation Required) */}
              {m.stagedActions && m.stagedActions.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider">
                    Approval Required (Human-in-the-Loop)
                  </div>
                  {m.stagedActions.map((pa) => (
                    <PendingActionCard
                      key={pa.id}
                      action={pa}
                      onResolved={() => {
                        window.location.reload();
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center text-slate-300 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 text-sm justify-start">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 px-4 py-3 text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-xs">Analyzing event state & executing tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask a question, assign tasks, or say "Remember that..."'
            className="flex-1 bg-slate-950 border-slate-800 text-sm focus-visible:ring-blue-500"
            disabled={loading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-500 text-white cursor-pointer px-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

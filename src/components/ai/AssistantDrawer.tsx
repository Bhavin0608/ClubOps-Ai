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
} from "lucide-react";
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
  "What could delay the event?",
  "What does the venue agreement say about capacity?",
  "Move the venue confirmation deadline to Friday and assign it to Rahul.",
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
        "Hello! I am your ClubOps AI Assistant. I can analyze operational risks, find facts in uploaded documents, extract action items, and stage confirmed actions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
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
            <p className="text-[11px] text-slate-400">Operational Copilot & Tool Executor</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
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

              <div className="whitespace-pre-wrap text-xs md:text-sm">{m.content}</div>

              {/* Staged Consequential Actions */}
              {m.stagedActions && m.stagedActions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {m.stagedActions.map((action) => (
                    <PendingActionCard key={action.id} action={action} />
                  ))}
                </div>
              )}

              {/* Grounded RAG Citations */}
              {m.citations && <CitationList citations={m.citations} />}
            </div>

            {m.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center text-slate-300 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 text-sm items-center text-slate-400">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Analyzing operations and executing tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-800 bg-slate-900/60 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask questions, query documents, or propose actions..."
            className="bg-slate-950 border-slate-700 text-sm h-10 placeholder:text-slate-500 focus-visible:ring-blue-500"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 bg-blue-600 hover:bg-blue-500 text-white flex-shrink-0"
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

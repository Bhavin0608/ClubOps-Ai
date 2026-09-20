"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Sparkles, X, Loader2, Users, AlertTriangle, Flame, Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BROADCAST_PRESETS = [
  {
    label: "Morning Volunteer Briefing",
    purpose: "Mandatory morning briefing for all logistics & tech volunteers in Main Hall B at 8:30 AM sharp.",
    audience: "VOLUNTEERS" as const,
    tone: "reminder" as const,
  },
  {
    label: "Keynote Room Relocation",
    purpose: "Notice to all attendees: Opening keynote has been moved to Auditorium 1 to accommodate higher seating capacity.",
    audience: "ALL" as const,
    tone: "informative" as const,
  },
  {
    label: "Urgent AV Soundcheck Delay",
    purpose: "Urgent alert to stage team: Stage 2 audio check postponed by 15 mins due to microphone recalibration.",
    audience: "VOLUNTEERS" as const,
    tone: "urgent" as const,
  },
  {
    label: "Welcome & Hackathon Kickoff",
    purpose: "Enthusiastic announcement welcoming all 500+ participants to Bit N Build 2026. Hacking begins now!",
    audience: "PARTICIPANTS" as const,
    tone: "enthusiastic" as const,
  },
];

const TONE_OPTIONS: {
  value: "urgent" | "enthusiastic" | "informative" | "reminder";
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "informative", label: "Informative", icon: Bell },
  { value: "urgent", label: "Urgent Alert", icon: AlertTriangle },
  { value: "reminder", label: "Reminder", icon: Bell },
  { value: "enthusiastic", label: "Enthusiastic", icon: Sparkles },
];

export function AnnouncementDraftModal({
  eventId,
  onDraftCreated,
}: {
  eventId: string;
  onDraftCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState<"VOLUNTEERS" | "PARTICIPANTS" | "ALL">("VOLUNTEERS");
  const [tone, setTone] = useState<"urgent" | "enthusiastic" | "informative" | "reminder">("informative");

  const handleApplyPreset = (preset: (typeof BROADCAST_PRESETS)[0]) => {
    setPurpose(preset.purpose);
    setAudience(preset.audience);
    setTone(preset.tone);
    toast.info(`Preset applied: ${preset.label}`);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      toast.error("Please provide the purpose of this announcement");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/announcement-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, purpose, audience, tone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to draft announcement");

      toast.success("AI draft synthesized! Review and authorize before broadcasting.");
      setOpen(false);
      setPurpose("");
      onDraftCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to draft announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] gap-1.5 text-xs font-bold h-9 px-3.5 rounded-xl shadow-md shadow-[#202940]/15 hover:shadow-lg transition-all border border-[#CAAA98]/30"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#CAAA98]" />
        <span>Draft Broadcast with AI</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#202940]/45 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col glass-architectural rounded-[28px] border border-[#CAAA98]/60 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#CAAA98]/30 bg-white/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#CAAA98]/25 border border-[#CAAA98]/50 flex items-center justify-center text-[#202940] shadow-xs">
                  <Megaphone className="w-5 h-5 text-[#202940]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#202940]">
                    AI Broadcast Copilot
                  </h3>
                  <p className="text-[11px] text-[#9A8678] font-medium">
                    Synthesize formatted broadcasts for WhatsApp, Telegram & live event screens
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl text-[#9A8678] hover:text-[#202940] hover:bg-[#CAAA98]/20 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              {/* Presets */}
              <div className="p-3 rounded-2xl bg-white/60 border border-[#CAAA98]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#4B4038] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#CAAA98]" />
                    Fast-Pass Broadcast Templates:
                  </span>
                  <span className="text-[10px] text-[#9A8678]">1-click fill</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {BROADCAST_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] hover:bg-[#202940] hover:text-white border border-[#CAAA98]/40 text-[11px] font-medium text-[#4B4038] whitespace-nowrap transition-all shadow-2xs cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <form id="draft-announcement-form" onSubmit={handleGenerate} className="space-y-4">
                {/* Purpose */}
                <div className="space-y-1.5">
                  <label className="text-[#4B4038] font-bold">
                    Announcement Objective & Core Details <span className="text-rose-600">*</span>
                  </label>
                  <Textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., Mandatory briefing for all logistics volunteers in Audi B at 5 PM today."
                    rows={4}
                    className="glass-architectural-input p-3 text-xs rounded-xl font-medium resize-none placeholder:text-[#9A8678]/70"
                    required
                  />
                </div>

                {/* Target Audience Chips */}
                <div className="space-y-1.5">
                  <label className="text-[#4B4038] font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#9A8678]" />
                    Target Audience
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { key: "VOLUNTEERS", label: "Volunteers Only" },
                        { key: "PARTICIPANTS", label: "Participants" },
                        { key: "ALL", label: "Everyone (All)" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setAudience(opt.key)}
                        className={cn(
                          "h-9 rounded-xl font-bold text-xs transition-all border cursor-pointer flex items-center justify-center gap-1",
                          audience === opt.key
                            ? "bg-[#202940] text-white border-[#202940] shadow-xs"
                            : "bg-white/80 text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20"
                        )}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Communication Tone Chips */}
                <div className="space-y-1.5">
                  <label className="text-[#4B4038] font-bold">Broadcast Tone</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TONE_OPTIONS.map((t) => {
                      const IconComp = t.icon;
                      const isSelected = tone === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTone(t.value)}
                          className={cn(
                            "h-9 px-2 rounded-xl font-bold text-xs transition-all border cursor-pointer flex items-center justify-center gap-1.5",
                            isSelected
                              ? "bg-[#202940] text-white border-[#202940] shadow-xs"
                              : "bg-white/80 text-[#4B4038] border-[#CAAA98]/50 hover:bg-[#CAAA98]/20"
                          )}
                        >
                          <IconComp className={cn("w-3.5 h-3.5", isSelected ? "text-[#CAAA98]" : "text-[#9A8678]")} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#CAAA98]/30 bg-white/50 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 px-4 rounded-xl border border-[#CAAA98]/50 hover:bg-[#CAAA98]/20 text-xs font-semibold text-[#4B4038] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="draft-announcement-form"
                disabled={loading || !purpose.trim()}
                className="h-10 px-5 rounded-xl bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] text-xs font-bold shadow-md shadow-[#202940]/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 border border-[#CAAA98]/35"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CAAA98]" />
                    <span>Synthesizing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#CAAA98]" />
                    <span>Generate AI Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  Sparkles,
  Send,
  Copy,
  Check,
  Users,
  Clock,
  Radio,
  Share2,
  MessageSquare,
  Search,
  CheckCircle2,
  Shield,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { formatInAppTimezone } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  audience: "VOLUNTEERS" | "PARTICIPANTS" | "ALL";
  status: "DRAFT" | "PUBLISHED";
  aiGenerated: boolean;
  publishedAt?: string | Date | null;
  createdAt: string | Date;
}

interface AnnouncementListProps {
  announcements: AnnouncementItem[];
  isOrganizer?: boolean;
  onUpdated?: () => void;
  onDraftWithAi?: () => void;
}

type AudienceFilterType = "ALL" | "VOLUNTEERS" | "PARTICIPANTS" | "EVERYONE";

export function AnnouncementList({
  announcements,
  isOrganizer = true,
  onUpdated,
  onDraftWithAi,
}: AnnouncementListProps) {
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilterType>("ALL");

  const drafts = useMemo(() => announcements.filter((a) => a.status === "DRAFT"), [announcements]);
  const published = useMemo(() => announcements.filter((a) => a.status === "PUBLISHED"), [announcements]);

  const filteredPublished = useMemo(() => {
    return published.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (audienceFilter !== "ALL") {
        if (audienceFilter === "EVERYONE" && item.audience !== "ALL") return false;
        if (audienceFilter === "VOLUNTEERS" && item.audience !== "VOLUNTEERS") return false;
        if (audienceFilter === "PARTICIPANTS" && item.audience !== "PARTICIPANTS") return false;
      }
      return true;
    });
  }, [published, search, audienceFilter]);

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      const res = await fetch(`/api/announcements/${id}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to publish announcement");

      toast.success("Broadcast dispatched and published live!");
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish broadcast");
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopyWhatsApp = (item: AnnouncementItem) => {
    const text = `📢 *${item.title.toUpperCase()}*\n\n${item.content}\n\n— _Sent via ClubOps AI Command Center_`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    toast.success("Copied with WhatsApp formatting!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopySlack = (item: AnnouncementItem) => {
    const text = `:mega: *${item.title}*\n\n${item.content}\n\n_Broadcasted via ClubOps AI_`;
    navigator.clipboard.writeText(text);
    setCopiedId(`slack-${item.id}`);
    toast.success("Copied with Slack formatting!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Telemetry Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Total Broadcasts
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#202940] text-white flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-[#CAAA98]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#202940]">{announcements.length}</span>
            <span className="text-[11px] text-[#9A8678] font-medium">all channels</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Published Live
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Radio className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{published.length}</span>
            <span className="text-[11px] text-[#9A8678] font-medium">dispatched broadcasts</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Staged AI Drafts
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#202940]">{drafts.length}</span>
            <span className="text-[11px] text-[#9A8678] font-medium">pending approval</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B4038] uppercase tracking-wider">
              Audience Reach
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#CAAA98]/25 text-[#202940] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#202940]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#202940]">3</span>
            <span className="text-[11px] text-[#9A8678] font-medium">channels active</span>
          </div>
        </div>
      </div>

      {/* 2. Pending Review & Drafts Section (Organizer Only) */}
      {isOrganizer && drafts.length > 0 && (
        <div className="space-y-3.5 p-5 rounded-2xl bg-amber-50/70 border border-amber-300/80 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 tracking-tight">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Staged Drafts Pending Authorization ({drafts.length})</span>
            </div>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
              Inert until published
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-white/95 border border-amber-300 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#202940] leading-snug">{d.title}</h4>
                      <div className="text-[11px] text-[#9A8678] font-medium mt-0.5">
                        Target Audience:{" "}
                        <strong className="text-[#202940] uppercase">{d.audience}</strong>
                      </div>
                    </div>
                    {d.aiGenerated && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#CAAA98]/20 text-[#202940] border border-[#CAAA98]/40 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#202940]" />
                        AI Draft
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#4B4038] leading-relaxed whitespace-pre-wrap bg-[#FAF8F5] p-3 rounded-xl border border-[#CAAA98]/30">
                    {d.content}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#CAAA98]/20">
                  <button
                    type="button"
                    onClick={() => handleCopyWhatsApp(d)}
                    className="h-8 px-3 rounded-xl border border-[#CAAA98]/50 hover:bg-[#CAAA98]/20 text-[11px] font-bold text-[#4B4038] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === d.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Text</span>
                  </button>

                  <button
                    type="button"
                    disabled={publishingId === d.id}
                    onClick={() => handlePublish(d.id)}
                    className="h-8 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-200" />
                    <span>{publishingId === d.id ? "Publishing..." : "Approve & Publish"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Published Broadcasts Stream */}
      <div className="space-y-4">
        {/* Toolbar & Audience Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl glass-architectural border border-[#CAAA98]/40 shadow-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#9A8678] ml-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search published broadcasts..."
              className="w-full h-9 px-3 text-xs glass-architectural-input rounded-xl font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[11px] text-[#9A8678] hover:text-[#202940] font-bold px-1"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(["ALL", "VOLUNTEERS", "PARTICIPANTS", "EVERYONE"] as AudienceFilterType[]).map(
              (filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setAudienceFilter(filter)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap",
                    audienceFilter === filter
                      ? "bg-[#202940] text-white border-[#202940] shadow-xs"
                      : "bg-white/80 text-[#4B4038] border-[#CAAA98]/40 hover:bg-[#CAAA98]/20"
                  )}
                >
                  {filter === "ALL" ? "All Broadcasts" : filter}
                </button>
              )
            )}
          </div>
        </div>

        {/* Broadcasts Feed */}
        {filteredPublished.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-architectural border border-[#CAAA98]/40 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#CAAA98]/20 flex items-center justify-center text-[#9A8678]">
              <Radio className="w-6 h-6 text-[#9A8678]" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#202940]">No broadcasts published yet</h4>
              <p className="text-xs text-[#9A8678] max-w-sm mt-0.5">
                {search || audienceFilter !== "ALL"
                  ? "No announcements match your search criteria."
                  : "Draft announcements with AI and publish them to volunteers and participants."}
              </p>
            </div>
            {onDraftWithAi && (
              <button
                type="button"
                onClick={onDraftWithAi}
                className="mt-2 px-4 py-2 rounded-xl bg-[#202940] hover:bg-[#182033] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#CAAA98]" />
                Draft with AI
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPublished.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl glass-architectural border border-[#CAAA98]/40 hover:border-[#CAAA98] transition-all space-y-3.5 shadow-xs"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-[#202940]">{item.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        LIVE
                      </span>
                      {item.aiGenerated && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#CAAA98]/20 text-[#202940] border border-[#CAAA98]/40 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#202940]" />
                          AI Synthesized
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#9A8678] flex items-center gap-2">
                      <span>
                        Audience: <strong className="text-[#202940]">{item.audience}</strong>
                      </span>
                      {item.publishedAt && (
                        <span>• Broadcasted {formatInAppTimezone(item.publishedAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Multi-platform Copy Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsApp(item)}
                      className="h-8 px-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/40 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Copy formatted message for WhatsApp"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopySlack(item)}
                      className="h-8 px-2.5 rounded-xl bg-white/80 hover:bg-[#CAAA98]/20 border border-[#CAAA98]/50 text-[#4B4038] text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Copy formatted message for Slack / Telegram"
                    >
                      {copiedId === `slack-${item.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Slack</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 rounded-xl bg-white/90 border border-[#CAAA98]/30 text-xs text-[#4B4038] leading-relaxed whitespace-pre-wrap font-medium">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Megaphone, Sparkles, Send, Copy, Check, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatInAppTimezone } from "@/lib/dates";

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
}

export function AnnouncementList({
  announcements,
  isOrganizer = true,
  onUpdated,
}: AnnouncementListProps) {
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      const res = await fetch(`/api/announcements/${id}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to publish announcement");

      toast.success("Announcement published to all volunteers/participants!");
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopyWhatsApp = (item: AnnouncementItem) => {
    const text = `📢 *${item.title.toUpperCase()}*\n\n${item.content}\n\n— _Sent via ClubOps AI Command Center_`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    toast.success("Formatted announcement copied for WhatsApp!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const drafts = announcements.filter((a) => a.status === "DRAFT");
  const published = announcements.filter((a) => a.status === "PUBLISHED");

  return (
    <div className="space-y-6">
      {/* Drafts Section (Organizer Only) */}
      {isOrganizer && drafts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review & Approval ({drafts.length})
          </div>

          <div className="space-y-3">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2.5 text-xs shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#202940] text-sm flex items-center gap-2">
                      <span>{d.title}</span>
                      {d.aiGenerated && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ECE5DE] text-[#202940] border border-[#CAAA98]/60 font-semibold">
                          AI Draft
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#9A8678]">
                      Audience: <strong className="text-[#202940]">{d.audience}</strong>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 font-semibold">
                    DRAFT (Inert)
                  </span>
                </div>

                <p className="text-[#4B4038] leading-relaxed whitespace-pre-wrap">
                  {d.content}
                </p>

                <div className="flex items-center justify-between pt-2.5 border-t border-amber-200/80">
                  <span className="text-[11px] text-[#9A8678] font-mono">
                    Created {formatInAppTimezone(d.createdAt, "dd MMM, HH:mm")}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => handlePublish(d.id)}
                    disabled={publishingId === d.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold h-8 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publish Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published Feed */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#202940] uppercase tracking-wider">
          <Megaphone className="w-3.5 h-3.5 text-[#CAAA98]" />
          Broadcast Feed ({published.length})
        </div>

        {published.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#9A8678] rounded-2xl border border-dashed border-[#CAAA98]/50 bg-white/40">
            No broadcast announcements published yet
          </div>
        ) : (
          published.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white/85 border border-[#CAAA98]/40 hover:border-[#CAAA98] hover:shadow-sm transition-all space-y-3 text-xs backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-[#202940] text-sm">{p.title}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9A8678] font-mono">
                  <Users className="w-3.5 h-3.5 text-[#CAAA98]" />
                  <span>{p.audience}</span>
                </div>
              </div>

              <p className="text-[#4B4038] leading-relaxed whitespace-pre-wrap">
                {p.content}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[#CAAA98]/30 text-[#9A8678]">
                <span className="text-[11px] font-mono">
                  Published {p.publishedAt ? formatInAppTimezone(p.publishedAt, "dd MMM, HH:mm") : "Recently"}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyWhatsApp(p)}
                  className="h-8 px-3 text-xs border-[#CAAA98]/60 text-[#202940] hover:bg-[#FAF8F5] gap-1.5 font-medium"
                >
                  {copiedId === p.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#9A8678]" /> Copy for WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

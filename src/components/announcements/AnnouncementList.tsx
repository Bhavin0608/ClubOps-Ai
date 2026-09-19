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
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Pending Review & Approval ({drafts.length})
          </div>

          <div className="space-y-2.5">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-2.5 text-xs shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                      <span>{d.title}</span>
                      {d.aiGenerated && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                          AI Draft
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Audience: <strong className="text-slate-300">{d.audience}</strong>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    DRAFT (Inert)
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {d.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Created {formatInAppTimezone(d.createdAt, "dd MMM, HH:mm")}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => handlePublish(d.id)}
                    disabled={publishingId === d.id}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs font-semibold h-8"
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
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Megaphone className="w-3.5 h-3.5 text-blue-400" />
          Broadcast Feed ({published.length})
        </div>

        {published.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400 rounded-xl border border-dashed border-slate-800">
            No broadcast announcements published yet
          </div>
        ) : (
          published.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-100 text-sm">{p.title}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{p.audience}</span>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {p.content}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-slate-400">
                <span className="text-[11px] font-mono">
                  Published {p.publishedAt ? formatInAppTimezone(p.publishedAt, "dd MMM, HH:mm") : "Recently"}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyWhatsApp(p)}
                  className="h-7 px-2.5 text-[11px] border-slate-700 text-slate-300 hover:bg-slate-800 gap-1.5"
                >
                  {copiedId === p.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" /> Copy for WhatsApp
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

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Sparkles, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/announcement-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, purpose, audience, tone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to draft announcement");

      toast.success("AI draft created! Review it in Drafts before publishing.");
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
        className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs font-semibold h-8"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Draft with AI
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-semibold text-white">AI Announcement Copilot</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">What is the purpose of this announcement? *</label>
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g., Mandatory briefing for all logistics volunteers in Audi B at 5 PM today."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="VOLUNTEERS">Volunteers</option>
                    <option value="PARTICIPANTS">Participants</option>
                    <option value="ALL">Everyone</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="informative">Informative</option>
                    <option value="urgent">Urgent</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                AI safety rule: Creates a <strong>DRAFT</strong> only. Unknown facts will be marked <code>[TBD]</code>. Publishing requires your explicit approval.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Generate Draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

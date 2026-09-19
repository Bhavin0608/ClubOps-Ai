"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function MeetingCreateModal({
  eventId,
  onMeetingCreated,
}: {
  eventId: string;
  onMeetingCreated?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [participants, setParticipants] = useState("Aman, Rahul, Priya, Sneha, Karan");
  const [transcript, setTranscript] = useState("");

  const handlePasteDemoTranscript = () => {
    setTitle("Coordination Sync Meeting");
    setTranscript(`Aman: Okay, let's start. Twelve days to go. First, venue. We still don't have the signed agreement.
Rahul: I'll get the signed copy from the college office by Friday.
Aman: Good. Sponsors next. Priya, where are we with the title sponsor?
Priya: They've verbally confirmed. I'll send them the final deliverables list by Wednesday.
Aman: Perfect. Sneha, how's the merchandise?
Sneha: I haven't started the volunteer T-shirt artwork. I can have it done by next Monday.
Karan: We're short on registration desk volunteers. We should recruit at least four more.
Aman: Agreed, that's important. Nobody has the bandwidth to own it right now, so let's come back to it.
Priya: What about participant certificates? We haven't started on those.
Aman: Right. Karan, can you look into templates?
Karan: Sure, I'll look into it.
Aman: Great. That's everything. Let's meet again on Thursday.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !transcript.trim()) {
      toast.error("Please provide meeting title and transcript");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Meeting
      const res = await fetch(`/api/events/${eventId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          meetingDate,
          participants: participants.split(",").map((p) => p.trim()).filter(Boolean),
          transcript,
        }),
      });

      const meeting = await res.json();
      if (!res.ok) throw new Error(meeting.error || "Failed to save meeting");

      toast.info("Extracting action items with AI...");

      // Step 2: Trigger AI extraction immediately
      const procRes = await fetch(`/api/meetings/${meeting.id}/process`, {
        method: "POST",
      });
      if (!procRes.ok) {
        const pErr = await procRes.json();
        throw new Error(pErr.error || "Extraction failed");
      }

      toast.success("Meeting processed and action items extracted!");
      setOpen(false);
      onMeetingCreated?.();
      router.push(`/events/${eventId}/meetings/${meeting.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5 text-xs font-semibold h-8"
      >
        <Plus className="w-3.5 h-3.5" />
        Process Meeting
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-semibold text-white">Process Notes or Transcript</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between bg-purple-950/30 border border-purple-800/40 p-2.5 rounded-lg">
                <span className="text-purple-300">Quick Demo: Load sample transcript from Scene 3</span>
                <button
                  type="button"
                  onClick={handlePasteDemoTranscript}
                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold"
                >
                  Paste Appendix A.1
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Meeting Title *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Core Logistics Sync"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Date *</label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Participants (comma-separated)</label>
                <Input
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Aman, Rahul, Priya, Sneha, Karan"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Transcript or Notes *</label>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste meeting transcript or raw notes here..."
                  rows={8}
                  className="font-mono text-xs leading-relaxed"
                  required
                />
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
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Save & Extract Items
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

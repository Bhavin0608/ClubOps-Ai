"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { MeetingCreateModal } from "@/components/meetings/MeetingCreateModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { Video, Calendar, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { formatDisplayDate } from "@/lib/dates";

interface MeetingItem {
  id: string;
  title: string;
  meetingDate: string;
  participants: string[];
  summary?: string | null;
  status: string;
  _count?: { actionItems: number };
}

export default function MeetingsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = use(props.params);
  const eventId = params.eventId;

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = () => {
    fetch(`/api/events/${eventId}/meetings`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setMeetings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeetings();
  }, [eventId]);

  if (loading) return <LoadingState message="Loading meeting transcripts..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-400" />
            Meeting Notes & AI Action Extraction
          </h2>
          <p className="text-xs text-slate-400">
            Process meeting transcripts into verified action items with confidence scores and verbatim quotes
          </p>
        </div>

        <MeetingCreateModal
          eventId={eventId}
          onMeetingCreated={fetchMeetings}
        />
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <Video className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No meetings recorded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click &ldquo;Process Meeting&rdquo; to paste your meeting notes or load the Scene 3 demo transcript.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/events/${eventId}/meetings/${m.id}`}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/90 transition-all space-y-3 group block"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    {m.title}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDisplayDate(m.meetingDate)}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {m._count?.actionItems ?? 0} Actions
                </span>
              </div>

              {m.summary && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {m.summary}
                </p>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-400 font-medium">
                <span>Review & Approve Tasks</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
